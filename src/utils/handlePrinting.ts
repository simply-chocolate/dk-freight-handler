export async function printFileLinux(fileName: string, printerName: string): Promise<string | void> {
  if (Deno.build.os === 'windows') {
    console.log("This function can't be used on Windows")
    return
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
    console.log('Unable to get print output')
    return
  }
  if (!output.success) {
    console.log('Print Failed with code: ', output.code)
    return
  }

  // manually close stdin
  child.stdin.close()
  const status = await child.status

  if (!status) {
    console.log('Unable to get print status')
    return
  }
  if (!status.success) {
    console.log('Print Failed with code: ', status.code)
    return
  }

  return 'success'
}
