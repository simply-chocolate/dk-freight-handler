import { AxiosError } from 'npm:axios@^1.4.0'
import { getDFSession } from './POST-login.ts'
import { sendTeamsMessage } from '../teams_notifier/SEND-teamsMessage.ts'

export async function getConsignments() {
  const session = await getDFSession()

  try {
    const res = await session.get('v1/Consignments', {
      params: {
        highwatermark: 90527962,
        pageNo: 1,
        pageSize: 200,
      },
    })

    console.log(res.data)
  } catch (error) {
    if (error instanceof AxiosError) {
      await sendTeamsMessage(
        'getConsignments DF request failed',
        `**Code**: ${error.response?.data.error.code}<BR>
          **Error Message**: ${error.response?.data.error.message}<BR>`
      )
    }
  }
}
