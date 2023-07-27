import { AxiosError } from 'npm:axios@^1.4.0'
import { getDFSession } from './POST-login.ts'
import { sendTeamsMessage } from '../teams_notifier/SEND-teamsMessage.ts'

export async function getConfiguration() {
  const session = await getDFSession()

  try {
    const res = await session.get('v1/Configuration/GetConfiguration', {
      params: {
        agreementNumber: Deno.env.get('DF_AGREEMENT_NUMBER'),
        agreementHub: Deno.env.get('DF_AGREEMENT_HUB'),
      },
    })
    console.log(res.data)
  } catch (error) {
    if (error instanceof AxiosError) {
      sendTeamsMessage(
        'getConfiguration DF request failed',
        `**Code**: ${error.response?.data.error.code}<BR>
          **Error Message**: ${error.response?.data.error.message}<BR>`
      )
    }
  }
}
