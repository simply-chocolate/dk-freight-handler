import { AxiosError } from 'npm:axios@^1.4.0'
import { getDFSession } from './POST-login.ts'

export async function getLabelsForPrintPDF(consignmentNumbers: string[]): Promise<void | Uint8Array> {
  const session = await getDFSession()

  try {
    const res = await session.get('v1/Report/GetLabelForPrint', {
      params: {
        consignmentNumbers: consignmentNumbers.join(','),
        labelType: 'StandardLabelForLabelPrinter',
      },
      responseType: 'arraybuffer',
    })

    return new Uint8Array(res.data)
  } catch (error) {
    if (error instanceof AxiosError) {
      console.log(error.response?.data)
      console.log(error.code)
    }
  }
}
