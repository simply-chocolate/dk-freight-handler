import { formToJSON } from 'npm:axios@^1.4.0'
import { getTrackAndTraceUrl } from '../fragt-api-wrapper/GET-TrackAndTraceUrl.ts'
import { getLabelsForPrintPDF } from '../fragt-api-wrapper/GET-labelsForPrintPDF.ts'
import { createConsignment } from '../fragt-api-wrapper/POST-createConsignment.ts.ts'
import { getAllValidatedDeliveryNotes } from '../sap-api-wrapper/GET-DeliveryNotes.ts'
import { setFreightBooked } from '../sap-api-wrapper/PATCH-SetFreightBooked.ts'

import { setTrackAndTraceUrl } from '../sap-api-wrapper/PATCH-SetTrackAndTrace.ts'
import { sendTeamsMessage } from '../teams_notifier/SEND-teamsMessage.ts'
import { writeConsignmentsList } from './handleConsignmentsListFiles.ts'
import { mapSAPDataToDF } from './handleMappingData.ts'
import { printFileLinux } from './handlePrinting.ts'
import { savePDF } from './savePDF.ts'
import { deliveryAddressIsValid } from './utils.ts'

export async function iterateDeliveryNotes() {
  const deliveryNotes = await getAllValidatedDeliveryNotes()

  if (!deliveryNotes) {
    console.log('delivery notes doesnt exist')
    return
  } else if (deliveryNotes.value.length === 0) {
    console.log('No delivery notes to iterate through')
    return
  }

  const consignmentIDs: string[] = []

  console.log("Let's iterate through the delivery notes and book some freight!")
  console.log('Consignment IDs at start: ', consignmentIDs)

  for (const deliveryNote of deliveryNotes.value) {
    console.log('deliveryNote:', deliveryNote.DocNum)

    if (deliveryNote.U_CCF_DF_FreightBooked === 'P') {
      if (deliveryNote.U_CCF_DF_ConsignmentID == undefined) {
        await sendTeamsMessage(
          'Trying to Print Label again, but no consignment ID is on order',
          `**Customer Number**: ${deliveryNote.CardCode} <BR>
          **Delivery Note Number**: ${deliveryNote.DocNum} <BR>`
        )

        continue
      }
      consignmentIDs.push(deliveryNote.U_CCF_DF_ConsignmentID)
      await setFreightBooked(deliveryNote.DocEntry, deliveryNote.DocNum)
      continue
    }

    if (deliveryNote.AddressExtension.ShipToCountry !== 'DK') {
      continue
    }

    if (!deliveryAddressIsValid(deliveryNote)) {
      await sendTeamsMessage(
        'Delivery address is not valid',
        `**Customer Number**: ${deliveryNote.CardCode} <BR>
        **Delivery Note Number**: ${deliveryNote.DocNum} <BR>`
      )
      continue
    }

    const consignmentData = mapSAPDataToDF(deliveryNote)
    if (consignmentData == undefined) {
      await sendTeamsMessage(
        'Mapping of SAP data to DF data failed',
        `**Customer Number**: ${deliveryNote.CardCode} <BR>
        **Delivery Note Number**: ${deliveryNote.DocNum} <BR>`
      )
      continue
    }

    console.log('consignments before creating consignment:', consignmentIDs)
    const consignmentID = await createConsignment(consignmentData, deliveryNote.DocNum)
    if (!consignmentID) {
      continue
    }

    console.log('consignments before pushing consignment IDs:', consignmentIDs)
    consignmentIDs.push(consignmentID)
    console.log('consignments after pushing consignment IDs:', consignmentIDs)

    const trackAndTraceUrl = await getTrackAndTraceUrl(consignmentID, deliveryNote.DocNum)
    if (!trackAndTraceUrl) {
      continue
    }

    await setTrackAndTraceUrl(trackAndTraceUrl, deliveryNote.DocEntry, deliveryNote.DocNum, consignmentID)
  }

  if (consignmentIDs.length === 0) {
    console.log('No consignmentIDs to save')
    return
  }

  console.log('Consignment IDs before writing to the list : ', consignmentIDs)

  const writeConsignmentsListResult = await writeConsignmentsList(consignmentIDs, 'booked')
  if (writeConsignmentsListResult.type === 'error') {
    await sendTeamsMessage('Error saving the ConsignmentList list', writeConsignmentsListResult.error)
  }

  // TODO: Send consignmentIDs to a txt file
  // TODO: We should check if there are any more open orders that needs to be booked
  // If everything is booked we should print the consignment list
  // If they time is after 13.30?? we should print the consignment list

  console.log("ConsignmentIDs that we're going to print labels for:", consignmentIDs)

  const labelsPdfData = await getLabelsForPrintPDF(consignmentIDs)
  if (!labelsPdfData) {
    return
  }

  const labelPath = await savePDF(labelsPdfData, 'labels')
  if (labelPath.type === 'error') {
    return
  }

  const labelPrinterName = Deno.env.get('PI_PRINTER_NAME_LABEL')
  if (!labelPrinterName) {
    await sendTeamsMessage('Label printer name is undefined', `Please set the environment variable PI_PRINTER_NAME_LABEL <BR>`)
    return
  }

  const printLabel = await printFileLinux(labelPath.data, labelPrinterName)
  if (!printLabel) {
    return
  }
}
