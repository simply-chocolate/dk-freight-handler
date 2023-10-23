import { getBusinessPartner } from '../sap-api-wrapper/GET-BusinessPartner.ts'
import { getAllOpenOrders } from '../sap-api-wrapper/GET-OpenOrders.ts'
import { setAddressValidationOrder } from '../sap-api-wrapper/PATCH-SetAddressValidationOrder.ts'
import { sleep } from './sleep.ts'
import { validateDocumentAddress } from './validateAddress.ts'

export async function validateOpenOrders() {
  const orders = await getAllOpenOrders()
  if (!orders) {
    return
  } else if (orders.value.length === 0) {
    return
  }

  for (const order of orders.value) {
    const businessPartner = await getBusinessPartner(order.CardCode)
    if (!businessPartner) {
      // Should never happen..?
      continue
    }
    if (businessPartner.Valid === 'tNO') {
      // BP is inactive, just skip it, can't validate for inactives
      continue
    }

    if (order.AddressExtension.ShipToCountry !== 'DK' && order.AddressExtension.ShipToCountry != null) {
      continue
    }

    if (order.AddressExtension.U_CCF_DF_AddressValidationS === 'validated') {
      await setAddressValidationOrder(order.DocEntry, order.DocNum, 'validated')
      continue
    }

    if (order.U_CCF_DF_ValidationTime) {
      if (order.U_CCF_DF_ValidationTime > order.UpdateTime && order.U_CCF_DF_ValidationDate >= order.UpdateDate) {
        continue
      }
    }

    const validationResponse = await validateDocumentAddress(order.AddressExtension, order.CardCode, order.DocNum)

    await sleep(1000 * 5) // Sleep for 5 seconds to let the address validation finish
    await setAddressValidationOrder(order.DocEntry, order.DocNum, validationResponse)
  }
}
