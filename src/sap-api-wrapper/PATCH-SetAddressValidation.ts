import { AxiosError, AxiosResponse } from 'npm:axios@1.4.0'
import { getAuthorizedClient } from './POST-login.ts'
import { sendTeamsMessage } from '../teams_notifier/SEND-teamsMessage.ts'

export async function setAddressValidation(
  docEntry: number,
  order: number,
  validationString: string
): Promise<AxiosResponse | void> {
  const authClient = await getAuthorizedClient()

  try {
    const res = await authClient.patch(`Order(${docEntry})`, {
      U_CCF_DF_AddressValidation: validationString,
    })

    return res.data
  } catch (error) {
    if (error instanceof AxiosError) {
      sendTeamsMessage(
        'setTrackAndTraceUrl SAP request failed',
        `**Order**: ${order}<BR>
        **Code**: ${error.code}<BR>
          **Error Message**: ${error.message}<BR>`
      )
    }
  }
}
