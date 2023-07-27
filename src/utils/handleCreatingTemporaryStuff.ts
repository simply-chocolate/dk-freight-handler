export async function getTemporaryFilePath(): Promise<string | void> {
  /*
  await Deno.writeTextFile(tempFilePath, 'Hello world!')
  const data = await Deno.readTextFile(tempFilePath)
  console.log('Temp file data:', data)

  const tempFilePath2 = await Deno.makeTempFile({
    prefix: 'logs_',
    suffix: '.txt',
  })

  console.log('Temp file path 2:', tempFilePath2)
  await Deno.mkdir('./tmp', { recursive: true })
  const tempFilePath3 = await Deno.makeTempFile({
    dir: './tmp',
  })

  console.log('Temp file path 3:', tempFilePath3)
  const tempDirPath = await Deno.makeTempDir()
  console.log('Temp dir path:', tempDirPath)
  const tempDirPath2 = await Deno.makeTempDir({
    prefix: 'logs_',
    suffix: '_folder',
    dir: './tmp',
  })
  console.log('Temp dir path 2:', tempDirPath2)
  const tempFilePath4 = Deno.makeTempFileSync()
  const tempDirPath3 = Deno.makeTempDirSync()
  console.log('Temp file path 4:', tempFilePath4)
  console.log('Temp dir path 3:', tempDirPath3)
  */
}
