import { getAllOpenDeliveryNotes } from '../sap-api-wrapper/GET-OpenDeliveries.ts'
import { setAddressValidationDelivery } from '../sap-api-wrapper/PATCH-SetAddressValidationDelivery.ts'
import { sleep } from './sleep.ts'
import { validateDocumentAddress } from './validateAddress.ts'

// TODO: DELETE THIS FUNCTION WHEN IN PRODUCTION
export async function validateOpenDeliveries() {
  const Deliveries = await getAllOpenDeliveryNotes()
  if (!Deliveries) {
    console.log('No open Deliveries found')
    return
  } else if (Deliveries.value.length === 0) {
    console.log('No open Deliveries found')
    return
  }

  console.log('Deliveries:', Deliveries.value.length)

  for (const delivery of Deliveries.value) {
    if (delivery.AddressExtension.ShipToCountry !== 'DK' && delivery.AddressExtension.ShipToCountry != null) {
      continue
    }

    console.log('validating address for delivery:', delivery.DocNum)

    const validationResponse = await validateDocumentAddress(delivery.AddressExtension, delivery.CardCode, delivery.DocNum)

    await sleep(1000 * 5) // Sleep for 5 seconds to let the address validation finish
    await setAddressValidationDelivery(delivery.DocEntry, delivery.DocNum, validationResponse)
  }
}
