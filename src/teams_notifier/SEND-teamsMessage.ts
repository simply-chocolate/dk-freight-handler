import { IncomingWebhook } from 'npm:ms-teams-webhook@2.0.2'
import { extractStringEnvVar } from '../utils/handleCheckingEnvs.ts'
import { sleep } from '../utils/sleep.ts'

const url = extractStringEnvVar('TEAMS_WEBHOOK_URL')
const webhook = new IncomingWebhook(url)

export async function sendTeamsMessage(title: string, body?: string, summary?: string) {
  while (true) {
    try {
      await sleep(5000)
      const webhookResult = await webhook.send({
        '@type': 'MessageCard',
        title: extractStringEnvVar('DEVICE_NAME') + ': ' + title,
        summary: summary,
        text: body,
      })
      if (webhookResult) {
        if (typeof webhookResult.text === 'string') {
          if (webhookResult.text.includes('429')) {
            console.log(new Date(new Date().getTime()).toLocaleString() + ': Rate limit reached for error messages')
            // Wait 10 minutes and try again
            await sleep(600000)
          } else {
            break
          }
        } else {
          break
        }
      }
    } catch (error) {
      console.log('Error sending teams message', error)
    }
  }
}
