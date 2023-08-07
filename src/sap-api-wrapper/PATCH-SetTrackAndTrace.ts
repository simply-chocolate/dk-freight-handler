import { AxiosError, AxiosResponse } from 'npm:axios@1.4.0'
import { getAuthorizedClient } from './POST-login.ts'
import { sendTeamsMessage } from '../teams_notifier/SEND-teamsMessage.ts'

export async function setTrackAndTraceUrl(
  trackAndTraceUrl: string,
  docEntry: number,
  deliveryNote: number,
  consignmentID: string
): Promise<AxiosResponse | void> {
  const authClient = await getAuthorizedClient()

  try {
    const res = await authClient.patch(`DeliveryNotes(${docEntry})`, {
      U_CCF_DF_TrackAndTrace: trackAndTraceUrl, // TODO: Change type to be able to contain more than 10 chars in SAP LOL. Just go with 100!
      U_CCF_DF_FreightBooked: 'Y',
      U_CCF_DF_ConsignmentID: consignmentID,
    })

    return res.data
  } catch (error) {
    if (error instanceof AxiosError) {
      sendTeamsMessage(
        'setTrackAndTraceUrl SAP request failed',
        `**DeliveryNote**: ${deliveryNote}<BR>
        **Code**: ${error.code}<BR>
          **Error Message**: ${JSON.stringify(error.response?.data)}<BR>
          **Body**: ${JSON.stringify(error.config)}<BR>`
      )
    }
  }
}
