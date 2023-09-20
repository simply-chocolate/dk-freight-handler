import { sendTeamsMessage } from '../teams_notifier/SEND-teamsMessage.ts'

// TODO Make this work correctly with Consignment IDS instead of printing PDF data
export async function saveConsignmentIds(consignmentIDs: string[], prefix: string): Promise<string | void> {
  if (Deno.build.os === 'windows') {
    try {
      // save path in test folder
      const tempFilePath = `./src/test/${prefix}.txt`
      await Deno.writeTextFile(tempFilePath, consignmentIDs.join(','))
      return tempFilePath
    } catch (error) {
      await sendTeamsMessage('Error saving the PDF ', error.message)
    }
  }
  try {
    const tempFilePath = await Deno.makeTempFile({
      prefix: prefix + '_',
      suffix: '.txt',
    })
    await Deno.writeTextFile(tempFilePath, consignmentIDs.join(','))
    return tempFilePath
  } catch (error) {
    await sendTeamsMessage('Error saving the PDF', error.message)
  }
}
