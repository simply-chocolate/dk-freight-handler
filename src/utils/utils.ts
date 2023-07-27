import { format, parseISO } from 'date-fns'
import { SapDeliveryNoteData } from '../sap-api-wrapper/GET-DeliveryNotes.ts'
import { sendTeamsMessage } from '../teams_notifier/SEND-teamsMessage.ts'

export function returnDateWithHours(date: string, hours: number) {
  const newDate = parseISO(date)
  newDate.setHours(hours)
  return format(newDate, 'yyyy-MM-dd+HH:mm:ss+02:00').replace('+', 'T')
}

export function deliveryAddressIsValid(deliveryNote: SapDeliveryNoteData): boolean {
  let addressErrors = ''
  deliveryNote.AddressExtension.ShipToBuilding != undefined
    ? ''
    : (addressErrors += 'ShipToBuilding is undefined (Might be called AddressID1). <BR>')
  deliveryNote.AddressExtension.ShipToStreet != undefined
    ? ''
    : (addressErrors += 'ShipToStreet is undefined <BR>')
  deliveryNote.AddressExtension.ShipToZipCode != undefined
    ? ''
    : (addressErrors += 'ShipToZipCode is undefined <BR>')
  deliveryNote.AddressExtension.ShipToCity != undefined
    ? ''
    : (addressErrors += 'ShipToCity is undefined <BR>')
  deliveryNote.AddressExtension.ShipToCountry != undefined
    ? ''
    : (addressErrors += 'ShipToCountry is undefined <BR>')

  if (addressErrors !== '') {
    sendTeamsMessage(
      'Delivery address could not be validated',
      'DeliveryNote: **' +
        deliveryNote.DocNum +
        '**has the following errors in the address: <BR>' +
        addressErrors
    )
    return false
  }

  return true
}
