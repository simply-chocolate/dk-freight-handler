import { format } from 'date-fns'
import { AxiosError } from 'npm:axios@^1.4.0'
import { getDFSession } from './POST-login.ts'
import { returnTypeString } from '../utils/returnTypes.ts'
import { sendTeamsMessage } from '../teams_notifier/SEND-teamsMessage.ts'

async function savePDF(pdfData: Uint8Array, savePath: string): Promise<returnTypeString> {
  try {
    await Deno.writeFile(savePath, pdfData)
    return { type: 'success', data: `PDF saved to ${savePath}` }
  } catch (error) {
    return { type: 'error', error: error.message }
  }
}

export async function getLabelsForPrintPrinter(consignmentNumbers: string[]) {
  const session = await getDFSession()

  try {
    const res = await session.get('v1/Report/GetLabelForPrint', {
      params: {
        consignmentNumbers: consignmentNumbers.join(','),
        labelType: 'StandardLabelForLabelPrinter',
      },
      responseType: 'arraybuffer',
    })

    const pdfData = new Uint8Array(res.data)
    const now = new Date()
    const timestamp = format(now, 'yyyy-MM-dd_HHmmss')
    const savePath = `./src/labels/labels_${timestamp}.pdf` // Replace with your desired save location
    await savePDF(pdfData, savePath)
  } catch (error) {
    if (error instanceof AxiosError) {
      console.log('getLabelsForPrintPrinter request failed', error)
      await sendTeamsMessage(
        'getLabelsForPrintPrinter request failed',
        `**consignmentNumbers**: ${consignmentNumbers.join(', ')}<BR>
          **Code**: ${error.code}<BR>
          **Error Message**: ${JSON.stringify(error.response?.data)}<BR>
          **Body**: ${JSON.stringify(error.config?.data)}<BR>
          `,
        'summary'
      )
    }
  }
}
