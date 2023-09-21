import { AxiosError } from 'npm:axios@^1.4.0'
import { getAuthorizedClient } from '../sap-api-wrapper/POST-login.ts'
import { sendTeamsMessage } from '../teams_notifier/SEND-teamsMessage.ts'

export async function logoutSap() {
  const authClient = await getAuthorizedClient()
  if (!authClient) return
  try {
    await authClient.post('Logout')
  } catch (error) {
    if (error instanceof AxiosError) {
      sendTeamsMessage(
        'logoutSap SAP request failed',
        `**Code**: ${error.code}<BR>
          **Error Message**: ${JSON.stringify(error.response?.data)}<BR>
          **Body**: ${JSON.stringify(error.config)}<BR>`
      )
    }
  }
}
