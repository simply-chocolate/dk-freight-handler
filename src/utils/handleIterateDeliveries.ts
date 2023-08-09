import { getTrackAndTraceUrl } from '../fragt-api-wrapper/GET-TrackAndTraceUrl.ts'
import { getConsignmentsListForPrint } from '../fragt-api-wrapper/GET-consignmentsListForPrintPDF.ts'
import { getLabelsForPrintPDF } from '../fragt-api-wrapper/GET-labelsForPrintPDF.ts'
import { createConsignment } from '../fragt-api-wrapper/POST-createConsignment.ts.ts'
import { getDeliveryNotes } from '../sap-api-wrapper/GET-DeliveryNotes.ts'
import { getOpenOrders } from '../sap-api-wrapper/GET-OpenOrders.ts'
import { setAddressValidation } from '../sap-api-wrapper/PATCH-SetAddressValidation.ts'
import { setTrackAndTraceUrl } from '../sap-api-wrapper/PATCH-SetTrackAndTrace.ts'
import { sendTeamsMessage } from '../teams_notifier/SEND-teamsMessage.ts'
import { mapSAPDataToDF } from './handleMappingData.ts'
import { printFileLinux } from './handlePrinting.ts'
import { savePDF } from './savePDF.ts'
import { sleep } from './sleep.ts'
import { deliveryAddressIsValid } from './utils.ts'
import { validateAddress } from './validateAddress.ts'

export async function iterateDeliveryNotes() {
  const orders = await getOpenOrders()
  if (!orders) {
    console.log('No open orders found')
    return
  } else if (orders.value.length === 0) {
    console.log('No open orders found')
    return
  }

  for (const order of orders.value) {
    if (order.AddressExtension.ShipToCountry !== 'DK') {
      continue
    }
    const validationResponse = await validateAddress(order.AddressExtension, order.CardCode, order.DocNum)
    sleep(1000 * 5) // Sleep for 5 seconds to let the address validation finish
    if (validationResponse) {
      setAddressValidation(order.DocEntry, order.DocNum, validationResponse)
      continue
    }
    setAddressValidation(order.DocEntry, order.DocNum, 'validated')
  }

  const deliveryNotes = await getDeliveryNotes()
  if (!deliveryNotes) {
    return
  } else if (deliveryNotes.value.length === 0) {
    return
  }

  const consignmentIDs: string[] = []

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

    const consignmentID = await createConsignment(consignmentData, deliveryNote.DocNum)
    if (!consignmentID) {
      continue
    }
    consignmentIDs.push(consignmentID)

    const trackAndTraceUrl = await getTrackAndTraceUrl(consignmentID, deliveryNote.DocNum)
    if (!trackAndTraceUrl) {
      continue
    }

    await setTrackAndTraceUrl(trackAndTraceUrl, deliveryNote.DocEntry, deliveryNote.DocNum, consignmentID)
  }

  if (consignmentIDs.length === 0) {
    return
  }

  return

  // Until we're out of development mode we will not reach below code.

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
