import { AxiosError, AxiosResponse } from 'npm:axios@1.4.0'
import { getAuthorizedClient } from './POST-login.ts'
import { sendTeamsMessage } from '../teams_notifier/SEND-teamsMessage.ts'

export async function setAddressValidationDelivery(docEntry: number, order: number, validationString: string): Promise<AxiosResponse | void> {
  const authClient = await getAuthorizedClient( 'PATCH Address validation DeliveryNotes' )

  if (validationString.length > 100) {
    validationString = validationString.substring(0, 100)
  }

  try {
    const res = await authClient.patch(`DeliveryNotes(${docEntry})`, {
      U_CCF_DF_AddressValidation: validationString,
    })

    return res.data
  } catch (error) {
    if (error instanceof AxiosError) {
      console.log('error in setAddressValidationDelivery', error)
      await sendTeamsMessage(
        'setAddressValidationOrder SAP request failed',
        `**Order**: ${order}<BR>
        **Code**: ${error.code}<BR>
          **Error Message**: ${JSON.stringify(error.response?.data)}<BR>
          **Body**: ${JSON.stringify(error.config)}<BR>`,
        'summary'
      )
    }
  }
}
