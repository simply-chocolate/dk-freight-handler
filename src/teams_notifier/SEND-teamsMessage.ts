import { IncomingWebhook } from 'npm:ms-teams-webhook@2.0.2';
import { extractStringEnvVar } from '../utils/handleCheckingEnvs.ts';
import { sleep } from '../utils/sleep.ts';

const url = extractStringEnvVar('TEAMS_WEBHOOK_URL');
const webhook = new IncomingWebhook(url);

export async function sendTeamsMessage(title: string, body: string, summary: string) {
  console.log(`${new Date().toLocaleString()}: ${title} - ${summary} - ${body}`);
  return
  while (true) {
    try {
      // Create the payload object
      const payload = {
        '@type': 'MessageCard',
        '@context': 'http://schema.org/extensions', // Include the @context field as it is required
        title: extractStringEnvVar('DEVICE_NAME') + ': ' + title,
        summary: summary,
        text: body,
      };

      // Send the message
      const webhookResult = await webhook.send(payload);

      // Handle the response
      if (webhookResult) {
        if (typeof webhookResult.text === 'string' && webhookResult.text.includes('429')) {
          console.log(new Date().toLocaleString() + ': Rate limit reached for error messages');
          // Wait 10 minutes and try again
          await sleep(600000);
        } else {
          break;
        }
      }
    } catch (error) {
      // Log error details
      console.log('Error sending teams message:', error.response?.data || error.message);
      break; // Stop retrying on error
    }
  }
}
