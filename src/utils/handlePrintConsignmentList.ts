import { getConsignmentsListForPrint } from '../fragt-api-wrapper/GET-consignmentsListForPrintPDF.ts'
import { sendTeamsMessage } from '../teams_notifier/SEND-teamsMessage.ts'
import { readConsignmentsList, writeConsignmentsList } from './handleConsignmentsListFiles.ts'
import { printFileLinux } from './handlePrinting.ts'
import { savePDF } from './savePDF.ts'

export async function printConsignmentList() {
  const bookedConsignmentIDs = await readConsignmentsList('booked')
  if (bookedConsignmentIDs.type === 'error') {
    await sendTeamsMessage('Error reading the ConsignmentList list', bookedConsignmentIDs.error)
    return
  }

  const printedConsignmentList = await readConsignmentsList('printed')
  if (printedConsignmentList.type === 'error') {
    await sendTeamsMessage('Error reading the ConsignmentList list', printedConsignmentList.error)
    return
  }

  let hasDiff = false
  for (const consignmentID of bookedConsignmentIDs.data) {
    if (!printedConsignmentList.data.includes(consignmentID)) {
      hasDiff = true
      break
    }
  }

  if (!hasDiff) {
    console.log('No new consignments to print')
    return
  }

  const consignmentList = await getConsignmentsListForPrint(bookedConsignmentIDs.data)
  if (!consignmentList) {
    await sendTeamsMessage('Error getting the PDF', 'Couldnt get the consignment list')
    return
  }

  const consignmentListPath = await savePDF(consignmentList, 'consignment_list')
  if (consignmentListPath.type === 'error') {
    await sendTeamsMessage('Error saving the PDF ', consignmentListPath.error)
    return
  }

  const consignmentListPrinterName = Deno.env.get('PI_PRINTER_NAME_CONSIGNMENTLIST')
  if (!consignmentListPrinterName) {
    await sendTeamsMessage('Consignment list printer name is undefined', `Please set the environment variable PI_PRINTER_NAME_CONSIGNMENTLIST <BR>`)
    return
  }
  const printConsignmentList = await printFileLinux(consignmentListPath.data, consignmentListPrinterName)
  if (printConsignmentList.type === 'error') {
    await sendTeamsMessage('Error printing the PDF ', printConsignmentList.error)
    return
  }

  const printedConsignmentListResult = await writeConsignmentsList(bookedConsignmentIDs.data, 'printed')
  if (printedConsignmentListResult.type === 'error') {
    await sendTeamsMessage('Error saving the Printed ConsignmentList list', printedConsignmentListResult.error)
  }
}
