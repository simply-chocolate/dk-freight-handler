import { getBusinessPartner } from '../sap-api-wrapper/GET-BusinessPartner.ts'
import { SapBusinessPartnerAddress } from '../sap-api-wrapper/GET-BusinessPartners.ts'
import { getAllStockTransfers } from '../sap-api-wrapper/GET-StockTransfers.ts'
import { setAddressValidationBusinessPartner } from '../sap-api-wrapper/PATCH-SetAddressValidationBusinessPartner.ts'
import { sendTeamsMessage } from '../teams_notifier/SEND-teamsMessage.ts'
import { bookFreight, printLabels } from './handleBookFreight.ts'
import { mapStockTransferToDeliveryNote } from './handleMappingData.ts'
import { sleep } from './sleep.ts'
import { validateBPAddress } from './validateAddress.ts'

export async function iterateStockTransfers() {
  const stockTransfers = await getAllStockTransfers()
  if (!stockTransfers) {
    return
  } else if (stockTransfers.value.length === 0) {
    return
  }

  const consignmentsIds: string[] = []

  for (const stockTransfer of stockTransfers.value) {
    console.log(new Date(new Date().getTime()).toLocaleString(), ': stockTransfer:', stockTransfer.DocNum)

    let amountOf01Lines = 0
    for (const line of stockTransfer.StockTransferLines) {
      if (line.FromWarehouseCode !== '01') {
        continue
      } else {
        amountOf01Lines++
      }
    }
    if (amountOf01Lines / stockTransfer.StockTransferLines.length < 0.8) {
      continue
    }

    const businessPartner = await getBusinessPartner(stockTransfer.CardCode)
    if (!businessPartner) {
      await sendTeamsMessage('No business partner found for this CardCode', `**DocNum**: ${stockTransfer.DocNum} **CardCode**: ${stockTransfer.CardCode}`)
      continue
    }

    let validatedAddress: SapBusinessPartnerAddress | undefined

    if (businessPartner.BPAddresses == undefined) {
      await sendTeamsMessage(
        'No business partner addresses found for this CardCode',
        `**DocNum**: ${stockTransfer.DocNum} **CardCode**: ${stockTransfer.CardCode}`
      )
      continue
    }

    const businessPartnerAddress = businessPartner.BPAddresses.find(
      (address) => address.AddressName === stockTransfer.ShipToCode && address.AddressType === 'bo_ShipTo' && address.Country === 'DK'
    )
    if (!businessPartnerAddress) {
      await sendTeamsMessage(
        'No business partner address found for this CardCode',
        `**DocNum**: ${stockTransfer.DocNum} **CardCode**: ${stockTransfer.CardCode} **ShipToCode**: ${stockTransfer.ShipToCode} `
      )
      continue
    }

    if (businessPartnerAddress.U_CCF_DF_AddressValidation.trim() !== 'validated') {
      console.log('Address isnt validated, validating...')
      let validationResponse = await validateBPAddress(businessPartnerAddress, stockTransfer.CardCode)
      if (validationResponse !== 'validated') {
        if (validationResponse.length > 254) {
          validationResponse = validationResponse.slice(0, 254)
        }

        if (validationResponse === businessPartnerAddress.U_CCF_DF_AddressValidation) {
          continue
        }

        businessPartnerAddress.U_CCF_DF_AddressValidation = validationResponse // Sleep for 5 seconds to let the address validation finish
        const adressValidationResult = await setAddressValidationBusinessPartner(businessPartner.CardCode, null, businessPartner.BPAddresses)
        if (!adressValidationResult) {
          sendTeamsMessage(
            'Error setting address validation on business partner',
            `**DocNum**: ${stockTransfer.DocNum} **CardCode**: ${stockTransfer.CardCode} **ShipToCode**: ${stockTransfer.ShipToCode} `
          )
        }

        await sleep(1000 * 30) // Sleep for 30 seconds to let data get sent to SAP
        continue
      } else {
        validatedAddress = businessPartnerAddress
      }
    } else {
      validatedAddress = businessPartnerAddress
    }

    if (!validatedAddress) {
      await sendTeamsMessage(
        'Address isnt validated',
        `**DocNum**: ${stockTransfer.DocNum} **CardCode**: ${stockTransfer.CardCode} **ShipToCode**: ${stockTransfer.ShipToCode} `
      )
      continue
    }

    const dataAsDeliveryNote = await mapStockTransferToDeliveryNote(stockTransfer, validatedAddress)
    if (!dataAsDeliveryNote) {
      continue
    }

    const orderNumber = parseInt(stockTransfer.Comments.substring(stockTransfer.Comments.length - 7, stockTransfer.Comments.length - 1))
    if (orderNumber == undefined) {
      await sendTeamsMessage('No order number found for delivery note', String(stockTransfer.DocNum))
      continue
    }

    const consignmentID = await bookFreight(dataAsDeliveryNote, orderNumber, 'StockTransfers')
    if (consignmentID.type === 'error') {
      await sendTeamsMessage('Error booking freight and printing label', consignmentID.error)
      continue
    }

    consignmentsIds.push(consignmentID.data)
  }

  const printLabelsResult = await printLabels(consignmentsIds)
  if (printLabelsResult.type === 'error') {
    await sendTeamsMessage('Error printing labels', printLabelsResult.error)
  }
}
