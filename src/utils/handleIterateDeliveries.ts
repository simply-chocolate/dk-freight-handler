import { getAllValidatedDeliveryNotes } from '../sap-api-wrapper/GET-DeliveryNotes.ts'
import { getRelatedOrders } from '../sap-api-wrapper/GET-RelatedOrders.ts'
import { setFreightBooked } from '../sap-api-wrapper/PATCH-SetFreightBooked.ts'

import { sendTeamsMessage } from '../teams_notifier/SEND-teamsMessage.ts'
import { bookFreight, printLabels } from './handleBookFreight.ts'
import { deliveryAddressIsValid } from './utils.ts'

export async function iterateDeliveryNotes() {
  const deliveryNotes = await getAllValidatedDeliveryNotes()

  if (!deliveryNotes) {
    return
  } else if (deliveryNotes.value.length === 0) {
    return
  }

  const docEntries: number[] = []
  for (const deliveryNote of deliveryNotes.value) {
    if (deliveryNote.DocumentLines[0].BaseEntry == undefined || !deliveryNote.DocumentLines[0]) {
      await sendTeamsMessage(
        'Delivery note has no base entry on first line or no first line',
        `**Customer Number**: ${deliveryNote.CardCode} <BR>
        **Delivery Note Number**: ${deliveryNote.DocNum} <BR>`
      )
      continue
    }
    docEntries.push(deliveryNote.DocumentLines[0].BaseEntry)
  }

  const relatedOrders = await getRelatedOrders(docEntries)
  if (!relatedOrders) {
    return
  }

  const consignmentIDs: string[] = []

  for (const deliveryNote of deliveryNotes.value) {
    console.log(new Date(new Date().getTime()).toLocaleString(), ': deliveryNote:', deliveryNote.DocNum)

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

    const orderNumber = relatedOrders.value.find((order) => order.DocEntry === deliveryNote.DocumentLines[0].BaseEntry)?.DocNum

    if (orderNumber == undefined) {
      await sendTeamsMessage(
        'No order number found for delivery note',
        `**Customer Number**: ${deliveryNote.CardCode} <BR>
        **Delivery Note Number**: ${deliveryNote.DocNum} <BR>`
      )
      continue
    }

    const consignmentID = await bookFreight(deliveryNote, orderNumber, 'DeliveryNotes')
    if (consignmentID.type === 'error') {
      await sendTeamsMessage(
        'Error booking freight and printing label',
        `Mapping of SAP data to DF data failed <BR>
         **Customer Number**: ${deliveryNote.CardCode} <BR>
          **Delivery Note Number**: ${deliveryNote.DocNum} <BR>
          **Error**: ${consignmentID.error}<BR>`
      )
      continue
    }
    console.log('Pushing consignmentID to consignmentIDs array:', consignmentID.data)
    consignmentIDs.push(consignmentID.data)
  }

  const labelPrintResult = await printLabels(consignmentIDs)
  if (labelPrintResult.type === 'error') {
    await sendTeamsMessage('Error printing labels', labelPrintResult.error)
  } else {
    console.log(labelPrintResult.data)
  }
}
