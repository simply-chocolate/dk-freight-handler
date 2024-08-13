import { AxiosError, AxiosResponse } from 'npm:axios@1.4.0'
import { getAuthorizedClient } from './POST-login.ts'
import { sendTeamsMessage } from '../teams_notifier/SEND-teamsMessage.ts'

export async function setTrackAndTraceUrl(
  trackAndTraceUrl: string,
  docEntry: number,
  deliveryNote: number,
  consignmentID: string,
  path: 'DeliveryNotes' | 'StockTransfers'
): Promise<AxiosResponse | void> {
  const authClient = await getAuthorizedClient( 'PATCH TrackAndTrace DeliveryNotes' )

  try {
    const res = await authClient.patch(`${path}(${docEntry})`, {
      U_CCF_DF_TrackAndTrace: trackAndTraceUrl,
      U_CCF_DF_FreightBooked: 'Y',
      U_CCF_DF_ConsignmentID: consignmentID,
    })

    return res.data
  } catch (error) {
    if (error instanceof AxiosError) {
      await sendTeamsMessage(
        `setTrackAndTraceUrl SAP request failed on ${path}`,
        `**DeliveryNote**: ${deliveryNote}<BR>
        **Code**: ${error.code}<BR>
          **Error Message**: ${JSON.stringify(error.response?.data)}<BR>
          **Body**: ${JSON.stringify(error.config)}<BR>`,
        'summary'
      )
    }
  }
}
