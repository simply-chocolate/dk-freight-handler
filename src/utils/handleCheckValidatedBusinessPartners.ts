import { getValidatedBusinessPartners } from '../sap-api-wrapper/GET-ValidatedBusinessPartners.ts'
import { setAddressValidationBusinessPartner } from '../sap-api-wrapper/PATCH-SetAddressValidationBusinessPartner.ts'
import { sendTeamsMessage } from '../teams_notifier/SEND-teamsMessage.ts'

// Checks already validated business partners to see if they've been updated since last validation
export async function handleCheckValidatedBusinessPartners() {
  const businessPartners = await getValidatedBusinessPartners()

  if (!businessPartners) {
    console.log('No validated business partners found')
    return
  } else if (businessPartners.value.length === 0) {
    console.log('No validated business partners found')
    return
  }

  for (const businessPartner of businessPartners.value) {
    console.log("Checking if validated business partner's data has been updated since last validation:", businessPartner.CardCode)

    if (businessPartner.U_CCF_DF_LastSuccessValidationDate >= businessPartner.UpdateDate) {
      await sendTeamsMessage(
        'Business Partner has not been updated since last validation',
        `**Customer Number**: ${businessPartner.CardCode} <BR>
         **Error**: Why is the query returning it then?? <BR>
        `
      )
      continue
    }
    await setAddressValidationBusinessPartner(businessPartner.CardCode, false)
  }
  return
}
