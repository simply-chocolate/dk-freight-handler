import { returnTypeString } from './returnTypes.ts'

export async function printFileLinux(fileName: string, printerName: string): Promise<returnTypeString> {
  if (Deno.build.os === 'windows') {
    return { type: 'error', error: "This function can't be used on Windows" }
  }
  // Guide to setup GK420d on linux using CUPS: https://www.zebra.com/content/dam/zebra_new_ia/en-us/software-printer/drivers/en/third-party/ZSN108111-v4_CUPS_Installation.pdf
  const command = new Deno.Command('lp', {
    args: ['-d', printerName, fileName],
    stdin: 'piped',
    stdout: 'piped',
  })
  const child = command.spawn()
  const output = await child.output()
  if (!output) {
    return { type: 'error', error: 'Unable to get print output' }
  }
  if (!output.success) {
    return { type: 'error', error: `Print Failed with code: ${output.code}` }
  }

  // manually close stdin
  child.stdin.close()
  const status = await child.status

  if (!status) {
    return { type: 'error', error: 'Unable to get print status' }
  }
  if (!status.success) {
    return { type: 'error', error: `Print Failed with code: ${status.code}` }
  }

  return { type: 'success', data: 'Printed successfully' }
}
