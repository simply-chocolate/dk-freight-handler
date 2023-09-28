import { getBusinessPartner } from '../sap-api-wrapper/GET-BusinessPartner.ts'
import { getAllStockTransfers } from '../sap-api-wrapper/GET-StockTransfers.ts'
import { sendTeamsMessage } from '../teams_notifier/SEND-teamsMessage.ts'

export async function iterateStockTransfers() {
  const stockTransfers = await getAllStockTransfers()
  if (!stockTransfers) {
    console.log('stockTransfers notes does not exist')
    return
  } else if (stockTransfers.value.length === 0) {
    console.log('No stockTransfers to iterate through')
    return
  }

  for (const stockTransfer of stockTransfers.value) {
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
      continue
    }
    if (businessPartner.value.length !== 1) {
      console.log('More or less than one business partner found for this CardCode', stockTransfer.DocNum, businessPartner.value)
      /*await sendTeamsMessage(
        'More or less than one business partner found for this CardCode',
        `**CardCode**: ${stockTransfer.CardCode} <BR>
        **StockTransfer**: ${stockTransfer.DocNum} <BR>
        **Amount of business partners found**: ${businessPartner.value.length} <BR>
        **Business Partners Found**: ${JSON.stringify(businessPartner.value)} <BR>
        `
      )*/
      continue
    }
    // find the shipping address that matches the one on the stock transfer
    const shippingAddress = businessPartner.value[0].BPAddresses.find((address) => {
      return address.AddressName === stockTransfer.ShipToCode
    })
    console.log('Found shipping address on stockTransfer: ', stockTransfer.DocNum, shippingAddress)

    // STEP ONE: Check if The FromWarehouseCode is 01 on line level.
    // ? : Do we need to check all the lines or just the first one?
    // We could iterate the lines and check if the FromWarehouseCode is 01 on all of them.
  }
}
