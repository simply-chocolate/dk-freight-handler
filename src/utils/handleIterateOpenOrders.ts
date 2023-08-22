import { getAllOpenOrders } from '../sap-api-wrapper/GET-OpenOrders.ts'
import { setAddressValidation } from '../sap-api-wrapper/PATCH-SetAddressValidation.ts'
import { sleep } from './sleep.ts'
import { validateAddress } from './validateAddress.ts'

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
    if (order.AddressExtension.ShipToCountry !== 'DK') {
      continue
    }

    console.log('Validating address for order: ' + order.DocNum)
    const validationResponse = await validateAddress(order.AddressExtension, order.CardCode, order.DocNum)

    await sleep(1000 * 5) // Sleep for 5 seconds to let the address validation finish
    if (validationResponse) {
      setAddressValidation(order.DocEntry, order.DocNum, validationResponse)
      continue
    }
    setAddressValidation(order.DocEntry, order.DocNum, 'validated')
  }
}
