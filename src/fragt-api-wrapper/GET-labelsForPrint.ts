import { format } from 'date-fns'
import { AxiosError } from 'npm:axios@^1.4.0'
import { getDFSession } from './POST-login.ts'

async function savePDF(pdfData: Uint8Array, savePath: string): Promise<void> {
  try {
    await Deno.writeFile(savePath, pdfData)
    console.log(`PDF saved successfully at ${savePath}`)
  } catch (error) {
    console.error('Error saving the PDF:', error.message)
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
      console.log(error.response?.data.error.message)
      console.log(error.code)
    }
  }
}
