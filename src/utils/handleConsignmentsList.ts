import { returnTypeString, returnTypeStringArray } from './returnTypes.ts'

export async function writeConsignmentsList(consignmentIDs: string[], prefix: 'booked' | 'printed'): Promise<returnTypeString> {
  const bookedConsignmentsList = await readConsignmentsList(prefix)
  if (bookedConsignmentsList.type === 'error') {
    return { type: 'error', error: bookedConsignmentsList.error }
  }

  for (const consignmentID of bookedConsignmentsList.data) {
    if (consignmentIDs.includes(consignmentID)) {
      continue
    }
    consignmentIDs.push(consignmentID)
  }

  try {
    const tempFilePath = `./src/cache/${prefix}_ConsignmentsList.txt`
    await Deno.writeTextFile(tempFilePath, consignmentIDs.join(','))
  } catch (error) {
    return { type: 'error', error: error.message }
  }

  return { type: 'success', data: `./src/cache/${prefix}_ConsignmentsList.txt` }
}

export async function readConsignmentsList(prefix: 'booked' | 'printed'): Promise<returnTypeStringArray> {
  try {
    const textFileContents = await Deno.readTextFile(`./src/cache/${prefix}_ConsignmentsList.txt`)
    if (!textFileContents) {
      return { type: 'error', error: `Couldnt read the ${prefix} consignment list` }
    }

    return { type: 'success', data: textFileContents.split(',') }
  } catch (error) {
    if (error.name === 'NotFound') {
      try {
        await Deno.writeTextFile(`./src/cache/${prefix}_ConsignmentsList.txt`, '')
      } catch (error) {
        return { type: 'error', error: error.message }
      }
      return { type: 'success', data: [] }
    } else {
      return { type: 'error', error: error.message }
    }
  }
}
