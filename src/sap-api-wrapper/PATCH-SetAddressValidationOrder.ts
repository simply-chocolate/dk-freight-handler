import { AxiosError, AxiosResponse } from 'npm:axios@1.4.0'
import { getAuthorizedClient } from './POST-login.ts'
import { sendTeamsMessage } from '../teams_notifier/SEND-teamsMessage.ts'

export async function setAddressValidationOrder(docEntry: number, order: number, validationString: string): Promise<AxiosResponse | void> {
  const authClient = await getAuthorizedClient()

  if (validationString.length > 100) {
    validationString = validationString.substring(0, 100)
  }

  try {
    const res = await authClient.patch(`Orders(${docEntry})`, {
      U_CCF_DF_AddressValidation: validationString,
      U_CCF_DF_ValidationTime: new Date(new Date().setHours(new Date().getHours() + 2, new Date().getMinutes() + 5)).toISOString().split('T')[1].split('.')[0],
      U_CCF_DF_ValidationDate: new Date().toISOString().split('T')[0],
    })

    return res.data
  } catch (error) {
    if (error instanceof AxiosError) {
      await sendTeamsMessage(
        'setAddressValidationOrder SAP request failed',
        `**Order**: ${order}<BR>
        **Code**: ${error.code}<BR>
          **Error Message**: ${JSON.stringify(error.response?.data)}<BR>
          **Body**: ${JSON.stringify(error.config)}<BR>`
      )
    }
  }
}
