import { getAllActiveBusinessPartners } from '../sap-api-wrapper/GET-BusinessPartners.ts'
import { setAddressValidationBusinessPartner } from '../sap-api-wrapper/PATCH-SetAddressValidationBusinessPartner.ts'
import { sleep } from './sleep.ts'
import { validateBPAddress } from './validateAddress.ts'

export async function validateBusinessPartners() {
  const businessPartners = await getAllActiveBusinessPartners()

  if (!businessPartners) {
    return
  } else if (businessPartners.value.length === 0) {
    return
  }

  for (const businessPartner of businessPartners.value) {
    let allAddressesValidated = true

    for (const address of businessPartner.BPAddresses) {
      if (address.U_CCF_DF_AddressValidation == 'validated') {
        continue
      }
      if (address.AddressType !== 'bo_ShipTo') {
        continue
      }
      if (address.Country !== 'DK') {
        continue
      }

      let validationResponse = await validateBPAddress(address, businessPartner.CardCode)
      if (validationResponse.length > 254) {
        validationResponse = validationResponse.slice(0, 254)
      }
      address.U_CCF_DF_AddressValidation = validationResponse

      if (validationResponse != 'validated') {
        allAddressesValidated = false
      }
      await sleep(1000 * 2) // Sleep for 2 seconds to let the address validation finish
    }

    await setAddressValidationBusinessPartner(businessPartner.CardCode, allAddressesValidated, businessPartner.BPAddresses)
    await sleep(1000 * 5) // Sleep for 5 seconds to let data get sent to SAP
  }

  return
}
