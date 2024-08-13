import { AxiosError } from 'npm:axios@^1.4.0'
import { getDFSession } from './POST-login.ts'
import { sendTeamsMessage } from '../teams_notifier/SEND-teamsMessage.ts'

type TrackAndTraceUrlData = {
  Url: string
}

export async function getTrackAndTraceUrl(consignmentID: string, deliveryNote: number): Promise<void | string> {
  const session = await getDFSession()

  try {
    const res = await session.get<TrackAndTraceUrlData>('/v1/TrackAndTrace/TrackTraceClientUrl', {
      params: {
        consignmentNumber: consignmentID,
      },
    })
    return res.data.Url
  } catch (error) {
    if (error instanceof AxiosError) {
      await sendTeamsMessage(
        'getTrackAndTraceUrl DF request failed',
        `**DeliveryNote**: ${deliveryNote}<BR>
        **Code**: ${error.response?.data.error.code}<BR>
          **Error Message**: ${error.response?.data.error.message}<BR>`,
        'summary'
      )
    }
  }
}
