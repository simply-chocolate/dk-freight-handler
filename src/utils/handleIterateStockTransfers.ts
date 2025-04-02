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
        console.log('Line is not from warehouse 01', line.FromWarehouseCode)
        continue
      } else {
        amountOf01Lines++
      }
    }
    if (amountOf01Lines / stockTransfer.StockTransferLines.length < 0.8) {
      console.log('Less than 80% of lines are from warehouse 01')
      continue
    }

    const businessPartner = await getBusinessPartner(stockTransfer.CardCode)
    if (!businessPartner) {
      console.log('No business partner found for this CardCode', stockTransfer.CardCode)
      // await sendTeamsMessage('No business partner found for this CardCode', `**DocNum**: ${stockTransfer.DocNum} **CardCode**: ${stockTransfer.CardCode}`)
      continue
    }

    let validatedAddress: SapBusinessPartnerAddress | undefined

    if (businessPartner.BPAddresses == undefined) {
      console.log('No business partner addresses found for this CardCode', stockTransfer.CardCode)
      // await sendTeamsMessage(
      //   'No business partner addresses found for this CardCode',
      //   `**DocNum**: ${stockTransfer.DocNum} **CardCode**: ${stockTransfer.CardCode}`
      // )
      continue
    }

    const businessPartnerAddress = businessPartner.BPAddresses.find(
      (address) => address.AddressName === stockTransfer.ShipToCode && address.AddressType === 'bo_ShipTo' && address.Country === 'DK'
    )
    if (!businessPartnerAddress) {
      console.log('No business partner address found for this CardCode', stockTransfer.CardCode)
      // await sendTeamsMessage(
      //   'No business partner address found for this CardCode',
      //   `**DocNum**: ${stockTransfer.DocNum} **CardCode**: ${stockTransfer.CardCode} **ShipToCode**: ${stockTransfer.ShipToCode} `
      // )
      continue
    }

    if (businessPartnerAddress.U_CCF_DF_AddressValidation == undefined || businessPartnerAddress.U_CCF_DF_AddressValidation.trim() !== 'validated') {
      let validationResponse = await validateBPAddress(businessPartnerAddress, stockTransfer.CardCode)

      if (validationResponse !== 'validated') {
        if (validationResponse.length > 254) {
          validationResponse = validationResponse.slice(0, 254)
        }

        if (validationResponse === businessPartnerAddress.U_CCF_DF_AddressValidation) {
          console.log('Address is already validated', stockTransfer.DocNum)
          continue
        }

        businessPartnerAddress.U_CCF_DF_AddressValidation = validationResponse // Sleep for 5 seconds to let the address validation finish
        const adressValidationResult = await setAddressValidationBusinessPartner(businessPartner.CardCode, null, businessPartner.BPAddresses)
        if (!adressValidationResult) {
          console.log('Error setting address validation on business partner', stockTransfer.CardCode)
          // sendTeamsMessage(
          //   'Error setting address validation on business partner',
          //   `**DocNum**: ${stockTransfer.DocNum} **CardCode**: ${stockTransfer.CardCode} **ShipToCode**: ${stockTransfer.ShipToCode} `
          // )
        }

        await sleep(1000 * 30) // Sleep for 30 seconds to let data get sent to SAP
        console.log('Address validation result', adressValidationResult)
        continue
      } else {
        validatedAddress = businessPartnerAddress
      }
    } else {
      validatedAddress = businessPartnerAddress
    }

    if (!validatedAddress) {
      console.log('No validated address found for this CardCode', stockTransfer.CardCode)
      // await sendTeamsMessage(
      //   'Address isnt validated',
      //   `**DocNum**: ${stockTransfer.DocNum} **CardCode**: ${stockTransfer.CardCode} **ShipToCode**: ${stockTransfer.ShipToCode} `
      // )
      continue
    }

    const dataAsDeliveryNote = await mapStockTransferToDeliveryNote(stockTransfer, validatedAddress)
    if (!dataAsDeliveryNote) {
      console.log('Error mapping stock transfer to delivery note', stockTransfer.DocNum)
      continue
    }

    const orderNumber = parseInt(stockTransfer.Comments.substring(stockTransfer.Comments.length - 7, stockTransfer.Comments.length - 1))
    if (orderNumber == undefined) {
      console.log('No order number found for delivery note', stockTransfer.DocNum)
      // await sendTeamsMessage('No order number found for delivery note', String(stockTransfer.DocNum))
      continue
    }

    const consignmentID = await bookFreight(dataAsDeliveryNote, orderNumber, 'StockTransfers')
    if (consignmentID.type === 'error') {
      console.log('Error booking freight and printing label', consignmentID.error)
      // await sendTeamsMessage('Error booking freight and printing label', consignmentID.error)
      continue
    }

    console.log(`Booking freight and printing label for stock transfer ${stockTransfer.DocNum} with consignment ID ${consignmentID.data}`)
    consignmentsIds.push(consignmentID.data)
  }

  const printLabelsResult = await printLabels(consignmentsIds)
  if (printLabelsResult.type === 'error') {
    console.log('Error printing labels', printLabelsResult.error) 
    // await sendTeamsMessage('Error printing labels', printLabelsResult.error)
  }
}
