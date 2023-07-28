export async function printFileLinux(fileName: string, printerName: string) {
  // Guide to setup GK420d on linux using CUPS: https://www.zebra.com/content/dam/zebra_new_ia/en-us/software-printer/drivers/en/third-party/ZSN108111-v4_CUPS_Installation.pdf
  const command = new Deno.Command('lp', {
    args: ['-d', printerName, fileName],
    stdin: 'piped',
    stdout: 'piped',
  })
  const child = command.spawn()

  await console.log(child.output())
  // open a file and pipe the subprocess output to it.

  // manually close stdin
  child.stdin.close()
  const status = await child.status
  console.log(status)
}
