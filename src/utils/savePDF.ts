import { sendTeamsMessage } from '../teams_notifier/SEND-teamsMessage.ts'

export async function savePDF(pdfData: Uint8Array, prefix: string): Promise<string | void> {
  try {
    const tempFilePath = await Deno.makeTempFile({
      prefix: prefix + '_',
      suffix: '.pdf',
    })
    await Deno.writeFile(tempFilePath, pdfData)
    return tempFilePath
  } catch (error) {
    sendTeamsMessage('Error saving the PDF', error.message)
  }
}
