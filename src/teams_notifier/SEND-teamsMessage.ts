import { IncomingWebhook } from 'npm:ms-teams-webhook@2.0.2'
import { extractStringEnvVar } from '../utils/handleCheckingEnvs.ts'

const url = extractStringEnvVar('TEAMS_WEBHOOK_URL')
const webhook = new IncomingWebhook(url)

export async function sendTeamsMessage(title: string, body?: string, summary?: string) {
  await webhook.send({
    '@type': 'MessageCard',
    title: title,
    summary: summary,
    text: body,
  })
}
