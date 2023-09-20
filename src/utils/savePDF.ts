import { returnTypeString } from './returnTypes.ts'

export async function savePDF(pdfData: Uint8Array, prefix: string): Promise<returnTypeString> {
  if (Deno.build.os === 'windows') {
    try {
      // save path in test folder
      const tempFilePath = `./src/test/${prefix}.pdf`
      await Deno.writeFile(tempFilePath, pdfData)
      return { type: 'success', data: tempFilePath }
    } catch (error) {
      return { type: 'error', error: error.message }
    }
  }
  try {
    const tempFilePath = await Deno.makeTempFile({
      prefix: prefix + '_',
      suffix: '.pdf',
    })
    await Deno.writeFile(tempFilePath, pdfData)
    return { type: 'success', data: tempFilePath }
  } catch (error) {
    return { type: 'error', error: error.message }
  }
}
