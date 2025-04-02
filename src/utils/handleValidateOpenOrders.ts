import { getBusinessPartner } from '../sap-api-wrapper/GET-BusinessPartner.ts'
import { getAllOpenOrders } from '../sap-api-wrapper/GET-OpenOrders.ts'
import { setAddressValidationOrder } from '../sap-api-wrapper/PATCH-SetAddressValidationOrder.ts'
import { sleep } from './sleep.ts'
import { validateDocumentAddress } from './validateAddress.ts'

export async function validateOpenOrders() {
  const orders = await getAllOpenOrders()
  console.log(!orders)
  if (!orders) {
    return
  } else if (orders.value.length === 0) {
    return
  }

  console.log(`Found ${orders.value.length} open orders`)

  for (const order of orders.value) {
    const businessPartner = await getBusinessPartner(order.CardCode)
    if (!businessPartner) {
      // Should never happen..?
      console.log(`No business partner found for order ${order.DocNum}`)
      continue
    }
    if (businessPartner.Valid === 'tNO') {
      // Business partner is inactive, skip it
      console.log(`Business partner ${order.CardCode} is inactive, skipping order ${order.DocNum}`)
      continue
    }

    if (order.AddressExtension.ShipToCountry !== 'DK' && order.AddressExtension.ShipToCountry != null) {
      console.log(`Order ${order.DocNum} is not in DK, skipping it`)
      // Country is not DK, skip it
      continue
    }

    if (order.AddressExtension.U_CCF_DF_AddressValidationS === 'validated') {
      // Address is already validated, skip it
      console.log(`Order ${order.DocNum} is already validated, skipping it`)
      await setAddressValidationOrder(order.DocEntry, order.DocNum, 'validated')
      continue
    }

    if (order.U_CCF_DF_ValidationTime) {
      // Check if the order is updated after the validation time
      
      if (order.U_CCF_DF_ValidationTime > order.UpdateTime && order.U_CCF_DF_ValidationDate >= order.UpdateDate) {
        console.log(`Order ${order.DocNum} is updated after the validation time, skipping it`)
        continue
      }
    }

    const validationResponse = await validateDocumentAddress(order.AddressExtension, order.CardCode, order.DocNum)
    if (validationResponse === "No address found in DAWA") {
      console.log(`No address found in DAWA for order ${order.DocNum}`)
      // console.log(order.AddressExtension)

    } else {
      console.log(`Validation response for order ${order.DocNum}: ${JSON.stringify(validationResponse)}`)
    }
    await sleep(1000 * 5) // Sleep for 5 seconds to let the address validation finish

    
    await setAddressValidationOrder(order.DocEntry, order.DocNum, validationResponse)
  }
}
