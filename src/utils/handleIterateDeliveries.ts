import { getTrackAndTraceUrl } from '../fragt-api-wrapper/GET-TrackAndTraceUrl.ts'
import { getConsignmentsListForPrint } from '../fragt-api-wrapper/GET-consignmentsListForPrintPDF.ts'
import { getLabelsForPrintPDF } from '../fragt-api-wrapper/GET-labelsForPrintPDF.ts'
import { createConsignment } from '../fragt-api-wrapper/POST-createConsignment.ts.ts'
import { getCustomers } from '../sap-api-wrapper/GET-CustomerData.ts'
import { getDeliveryNotes } from '../sap-api-wrapper/GET-DeliveryNotes.ts'
import { setTrackAndTraceUrl } from '../sap-api-wrapper/PATCH-SetTrackAndTrace.ts'
import { sendTeamsMessage } from '../teams_notifier/SEND-teamsMessage.ts'
import { mapSAPDataToDF } from './handleMappingData.ts'
import { printFileLinux } from './handlePrinting.ts'
import { savePDF } from './savePDF.ts'
import { deliveryAddressIsValid } from './utils.ts'

export async function iterateDeliveryNotes() {
  const deliveryNotes = await getDeliveryNotes()
  if (!deliveryNotes) {
    console.log('No delivery notes found')
    return
  } else if (deliveryNotes.value.length === 0) {
    console.log('No delivery notes found')
    return
  }
  const customers = await getCustomers(deliveryNotes)
  if (!customers) {
    console.log('No customers found')
    return
  } else if (customers.value.length === 0) {
    console.log('No customers found')
    return
  }

  const consignmentIDs: string[] = []

  for (const deliveryNote of deliveryNotes.value) {
    if (deliveryNote.AddressExtension.ShipToCountry !== 'DK') {
      continue
    }

    const customer = customers.value.find((customer) => customer.CardCode === deliveryNote.CardCode)

    if (!customer) {
      await sendTeamsMessage(
        'Customer number not found in SAP',
        `**Customer Number**: ${deliveryNote.CardCode} <BR>
        **Delivery Note Number**: ${deliveryNote.DocNum} <BR>`
      )
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

    const consignmentID = await createConsignment(consignmentData, deliveryNote.DocNum)
    if (!consignmentID) {
      continue
    }
    consignmentIDs.push(consignmentID)

    const trackAndTraceUrl = await getTrackAndTraceUrl(consignmentID, deliveryNote.DocNum)
    if (!trackAndTraceUrl) {
      continue
    }

    /*const SetTrackAndTraceResult = */ await setTrackAndTraceUrl(
      trackAndTraceUrl,
      deliveryNote.DocEntry,
      deliveryNote.DocNum
    )
    /*
    // TODO: Since theres no actions after this, we don't need to handle it to save memory
    if (!SetTrackAndTraceResult) {
      continue
    }
    */
  }

  if (consignmentIDs.length === 0) {
    return
  }

  const labelsPdfData = await getLabelsForPrintPDF(consignmentIDs)
  if (!labelsPdfData) {
    return
  }
  const consignmentList = await getConsignmentsListForPrint(consignmentIDs)
  if (!consignmentList) {
    return
  }

  const labelPath = await savePDF(labelsPdfData, 'labels')
  if (!labelPath) {
    return
  }

  const labelPrinterName = Deno.env.get('PI_PRINTER_NAME_LABEL')
  if (!labelPrinterName) {
    await sendTeamsMessage(
      'Label printer name is undefined',
      `Please set the environment variable PI_PRINTER_NAME_LABEL <BR>`
    )
    return
  }

  const printLabel = await printFileLinux(labelPath, labelPrinterName)
  if (!printLabel) {
    return
  }

  const consignmentListPath = await savePDF(consignmentList, 'consignment_list')
  if (!consignmentListPath) {
    return
  }

  const consignmentListPrinterName = Deno.env.get('PI_PRINTER_NAME_CONSIGNMENTLIST')
  if (!consignmentListPrinterName) {
    await sendTeamsMessage(
      'Consignment list printer name is undefined',
      `Please set the environment variable PI_PRINTER_NAME_CONSIGNMENTLIST <BR>`
    )
    return
  }
  const printConsignmentList = await printFileLinux(consignmentListPath, consignmentListPrinterName)
  if (!printConsignmentList) {
    return
  }
}
