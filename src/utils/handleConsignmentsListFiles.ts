import { returnTypeString, returnTypeStringArray } from './returnTypes.ts'

export async function writeConsignmentsList(consignmentIDs: string[], prefix: 'booked' | 'printed'): Promise<returnTypeString> {
  const bookedConsignmentsList = await readConsignmentsList(prefix)
  if (bookedConsignmentsList.type === 'error') {
    return { type: 'error', error: bookedConsignmentsList.error }
  }

  const newlyBookedConsignments = consignmentIDs.filter((consignmentID) => !bookedConsignmentsList.data.includes(consignmentID))
  if (newlyBookedConsignments.length === 0) {
    return { type: 'success', data: 'No new consignments to add' }
  }
  for (const newlyBookedConsignment of newlyBookedConsignments) {
    bookedConsignmentsList.data.push(newlyBookedConsignment)
  }

  try {
    await Deno.writeTextFile(`./src/cache/${prefix}_ConsignmentsList.txt`, bookedConsignmentsList.data.join(','))
  } catch (error) {
    return { type: 'error', error: error.message }
  }

  return { type: 'success', data: `./src/cache/${prefix}_ConsignmentsList.txt` }
}

export async function readConsignmentsList(prefix: 'booked' | 'printed'): Promise<returnTypeStringArray> {
  try {
    const textFileContents = await Deno.readTextFile(`./src/cache/${prefix}_ConsignmentsList.txt`)

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

export async function emptyConsignmentLists(): Promise<returnTypeString> {
  try {
    await Deno.writeTextFile(`./src/cache/booked_ConsignmentsList.txt`, '')
  } catch (error) {
    return { type: 'error', error: 'error resetting booked_ConsignmentsList. Error: ' + error.message }
  }
  try {
    await Deno.writeTextFile(`./src/cache/printed_ConsignmentsList.txt`, '')
  } catch (error) {
    return { type: 'error', error: 'error resetting printed_ConsignmentsList. Error: ' + error.message }
  }

  return { type: 'success', data: 'Emptied consignment lists' }
}
