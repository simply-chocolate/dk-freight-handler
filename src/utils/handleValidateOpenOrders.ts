import { getAllOpenOrders } from '../sap-api-wrapper/GET-OpenOrders.ts'
import { setAddressValidationOrder } from '../sap-api-wrapper/PATCH-SetAddressValidationOrder.ts'
import { sleep } from './sleep.ts'
import { validateDocumentAddress } from './validateAddress.ts'

export async function validateOpenOrders() {
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
    if (order.AddressExtension.U_CCF_DF_AddressValidationS === 'validated') {
      // This will save resources since we don't have to validate the address again
      // It does however require that we're 100% certain that the address on the order is validated, which we should be with the current setup.
      console.log('Address validated on BP for order:', order.DocNum, 'skipping...')
      await setAddressValidationOrder(order.DocEntry, order.DocNum, 'validated')
      continue
    }

    if (order.U_CCF_DF_ValidationTime) {
      if (order.U_CCF_DF_ValidationTime > order.UpdateTime) {
        console.log('Order hasnt been changed after last validation: ', order.DocNum, ' skipping...')
        continue
      }
    }

    console.log('DAWA validating address for order:', order.DocNum)

    const validationResponse = await validateDocumentAddress(order.AddressExtension, order.CardCode, order.DocNum)

    await sleep(1000 * 5) // Sleep for 5 seconds to let the address validation finish
    await setAddressValidationOrder(order.DocEntry, order.DocNum, validationResponse)
  }
}
