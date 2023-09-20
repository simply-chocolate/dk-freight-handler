import { sendTeamsMessage } from '../teams_notifier/SEND-teamsMessage.ts'

export async function savePDF(pdfData: Uint8Array, prefix: string): Promise<string | void> {
  if (Deno.build.os === 'windows') {
    try {
      // save path in test folder
      const tempFilePath = `./src/test/${prefix}.pdf`
      await Deno.writeFile(tempFilePath, pdfData)
      return tempFilePath
    } catch (error) {
      await sendTeamsMessage('Error saving the PDF ', error.message)
    }
  }
  try {
    const tempFilePath = await Deno.makeTempFile({
      prefix: prefix + '_',
      suffix: '.pdf',
    })
    await Deno.writeFile(tempFilePath, pdfData)
    return tempFilePath
  } catch (error) {
    await sendTeamsMessage('Error saving the PDF', error.message)
  }
}
