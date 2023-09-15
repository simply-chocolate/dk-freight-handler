import { getAllOpenOrders } from '../sap-api-wrapper/GET-OpenOrders.ts'
import { setAddressValidationOrder } from '../sap-api-wrapper/PATCH-SetAddressValidationOrder.ts'
import { sleep } from './sleep.ts'
import { validateDocumentAddress } from './validateAddress.ts'

export async function iterateOpenOrders() {
  const orders = await getAllOpenOrders()
  if (!orders) {
    console.log('No open orders found')
    return
  } else if (orders.value.length === 0) {
    console.log('No open orders found')
    return
  }

  for (const order of orders.value) {
    if (order.AddressExtension.ShipToCountry !== 'DK' && order.AddressExtension.ShipToCountry != null) {
      continue
    }

    const validationResponse = await validateDocumentAddress(order.AddressExtension, order.CardCode, order.DocNum)

    await sleep(1000 * 5) // Sleep for 5 seconds to let the address validation finish
    await setAddressValidationOrder(order.DocEntry, order.DocNum, validationResponse)
  }
}
