import { getTrackAndTraceUrl } from '../fragt-api-wrapper/GET-TrackAndTraceUrl.ts'
import { getLabelsForPrintPDF } from '../fragt-api-wrapper/GET-labelsForPrintPDF.ts'
import { createConsignment } from '../fragt-api-wrapper/POST-createConsignment.ts.ts'
import { SapDeliveryNoteData } from '../sap-api-wrapper/GET-DeliveryNotes.ts'
import { setTrackAndTraceUrl } from '../sap-api-wrapper/PATCH-SetTrackAndTrace.ts'
import { mapSAPDataToDF } from './handleMappingData.ts'
import { printFileLinux } from './handlePrinting.ts'
import { returnTypeString } from './returnTypes.ts'
import { savePDF } from './savePDF.ts'

export async function bookFreight(deliveryNote: SapDeliveryNoteData, orderNumber: number, type: 'DeliveryNotes' | 'StockTransfers'): Promise<returnTypeString> {
  const consignmentData = mapSAPDataToDF(deliveryNote, orderNumber)
  if (consignmentData == undefined) {
    return { type: 'error', error: 'Mapping of SAP data to DF data failed' }
  }

  const consignmentID = await createConsignment(consignmentData, deliveryNote.DocNum)
  if (!consignmentID) {
    return { type: 'error', error: 'Consignment creation failed' }
  }

  const trackAndTraceUrl = await getTrackAndTraceUrl(consignmentID, deliveryNote.DocNum)
  if (!trackAndTraceUrl) {
    return { type: 'error', error: 'Track and trace url creation failed' }
  }

  await setTrackAndTraceUrl(trackAndTraceUrl, deliveryNote.DocEntry, deliveryNote.DocNum, consignmentID, type)

  return { type: 'success', data: consignmentID }
}

export async function printLabels(consignmentIDs: string[]): Promise<returnTypeString> {
  if (consignmentIDs.length === 0) {
    return { type: 'success', data: 'No consignmentIDs to save' }
  }

  const labelsPdfData = await getLabelsForPrintPDF(consignmentIDs)
  if (!labelsPdfData) {
    return { type: 'error', error: 'Labels PDF data is undefined' }
  }

  const labelPath = await savePDF(labelsPdfData, 'labels')
  if (labelPath.type === 'error') {
    return { type: 'error', error: labelPath.error }
  }

  const labelPrinterName = Deno.env.get('PI_PRINTER_NAME_LABEL')
  if (!labelPrinterName) {
    return { type: 'error', error: 'Label printer name is undefined <BR> Please set the environment variable PI_PRINTER_NAME_LABEL <BR>' }
  }

  const printLabel = await printFileLinux(labelPath.data, labelPrinterName)
  if (!printLabel) {
    return { type: 'error', error: 'Label printing failed' }
  }

  return { type: 'success', data: 'Labels printed' }
}
