import { getConsignmentsListForPrint } from '../fragt-api-wrapper/GET-consignmentsListForPrintPDF.ts'
import { sendTeamsMessage } from '../teams_notifier/SEND-teamsMessage.ts'
import { printFileLinux } from './handlePrinting.ts'
import { savePDF } from './savePDF.ts'

export async function printConsignmentList(consignmentIDs: string[]) {
  // TODO: Save consignment ids to a file, so we can print a consignemnt list at the end of each day.
  // Then we don't need to pass consignmentIDs as a parameter to this function.
  // When we have successfully the consignment list, we can delete the file.

  const consignmentList = await getConsignmentsListForPrint(consignmentIDs)
  if (!consignmentList) {
    return
  }

  const consignmentListPath = await savePDF(consignmentList, 'consignment_list')
  if (!consignmentListPath) {
    return
  }

  const consignmentListPrinterName = Deno.env.get('PI_PRINTER_NAME_CONSIGNMENTLIST')
  if (!consignmentListPrinterName) {
    await sendTeamsMessage('Consignment list printer name is undefined', `Please set the environment variable PI_PRINTER_NAME_CONSIGNMENTLIST <BR>`)
    return
  }
  const printConsignmentList = await printFileLinux(consignmentListPath, consignmentListPrinterName)
  if (!printConsignmentList) {
    return
  }
}
