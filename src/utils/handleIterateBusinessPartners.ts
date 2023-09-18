import { getAllActiveBusinessPartners } from '../sap-api-wrapper/GET-BusinessPartners.ts'
import { setAddressValidationBusinessPartner } from '../sap-api-wrapper/PATCH-SetAddressValidationBusinessPartner.ts'
import { sleep } from './sleep.ts'
import { validateBPAddress } from './validateAddress.ts'

export async function iterateBusinessPartners() {
  const businessPartners = await getAllActiveBusinessPartners()

  if (!businessPartners) {
    console.log('No active business partners found')
    return
  } else if (businessPartners.value.length === 0) {
    console.log('No active business partners found')
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

      await sleep(1000 * 30) // Sleep for 5 seconds to let the address validation finish

      console.log('validating address for business partner:', businessPartner.CardCode, address.AddressName)

      let validationResponse = await validateBPAddress(address, businessPartner.CardCode)
      if (validationResponse.length > 254) {
        validationResponse = validationResponse.slice(0, 254)
      }
      address.U_CCF_DF_AddressValidation = validationResponse
      if (validationResponse != 'validated') {
        allAddressesValidated = false
      }
    }
    await setAddressValidationBusinessPartner(businessPartner.CardCode, businessPartner.BPAddresses, allAddressesValidated)
  }

  return
}
