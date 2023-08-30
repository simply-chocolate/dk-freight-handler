import { IncomingWebhook } from 'npm:ms-teams-webhook@2.0.2'
import { extractStringEnvVar } from '../utils/handleCheckingEnvs.ts'

const url = extractStringEnvVar('TEAMS_WEBHOOK_URL')
const webhook = new IncomingWebhook(url)

export async function sendTeamsMessage(title: string, body?: string, summary?: string) {
  while (true) {
    const webhookResult = await webhook.send({
      '@type': 'MessageCard',
      title: title,
      summary: summary,
      text: body,
    })
    if (webhookResult) {
      if (typeof webhookResult.text === 'string') {
        if (webhookResult.text.includes('429')) {
          console.log('Rate limit reached')
          // Wait 10 minutes and try again
        } else {
          break
        }
      } else {
        break
      }
    }
  }
}
