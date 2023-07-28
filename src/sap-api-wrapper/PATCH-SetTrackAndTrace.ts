import { AxiosError } from 'npm:axios@1.4.0'
import { getAuthorizedClient } from './POST-login.ts'
import { sendTeamsMessage } from '../teams_notifier/SEND-teamsMessage.ts'

export async function setTrackAndTraceUrl(trackAndTraceUrl: string, deliveryNote: number): Promise<void> {
  const authClient = await getAuthorizedClient()

  try {
    const res = await authClient.patch(`DeliveryNotes('${deliveryNote}')`, {
      U_CCF_DF_TrackAndTrace: trackAndTraceUrl,
    })

    return res.data
  } catch (error) {
    if (error instanceof AxiosError) {
      console.log(error.config)
      sendTeamsMessage(
        'setTrackAndTraceUrl SAP request failed',
        `**Code**: ${error.response?.data.error.code}<BR>
          **Error Message**: ${error.response?.data.error.message.value}<BR>`
      )
    }
  }
}
