import { format, parseISO } from 'npm:date-fns'
import { SapDeliveryNoteData } from '../sap-api-wrapper/GET-DeliveryNotes.ts'
import { sendTeamsMessage } from '../teams_notifier/SEND-teamsMessage.ts'

export function returnDateWithHours(date: string, hours: number) {
  const newDate = parseISO(date)
  newDate.setHours(hours)
  return format(newDate, 'yyyy-MM-dd+HH:mm:ss').replace('+', 'T')
  // TODO: Figure out if this can handle Daylight savings time
}

export function setDotIntervals(deliveryDate: string, timeslot: string, dotType: string): [string, string] {
  // Timeslot is in format HH:mm:ss
  const today = new Date(deliveryDate)
  const [hours, minutes, _seconds] = timeslot.split(':')

  const intervalStart = new Date(today.getTime() + 86400000)
  intervalStart.setHours(parseInt(hours)) // add two hours to get to UTC+2 TODO: What happens when DLS ends or starts??
  intervalStart.setMinutes(parseInt(minutes))

  let intervalEnd = intervalStart

  if (dotType === 'Dot1') {
    if (intervalStart.getHours() < 7) {
      intervalStart.setHours(7)
      intervalStart.setMinutes(0)
    }

    intervalEnd.setHours(10)
    intervalEnd.setMinutes(0)
  } else if (dotType === 'Dot2') {
    if (intervalStart.getHours() < 9) {
      intervalStart.setHours(9)
      intervalStart.setMinutes(0)
    }

    intervalEnd = new Date(intervalStart.getTime() + 2 * 60 * 60 * 1000) // add two hours

    if (intervalEnd.getHours() > 15) {
      intervalEnd.setHours(15)
      intervalEnd.setMinutes(0)
      intervalStart.setHours(13)
      intervalStart.setMinutes(0)
    }
  } else if (dotType === 'Dot3') {
    if (intervalStart.getHours() < 6) {
      intervalStart.setHours(6)
      intervalStart.setMinutes(0)
    }

    intervalEnd = new Date(intervalStart.getTime() + 30 * 60 * 1000) // add 15 minutes

    if (intervalEnd.getHours() > 18) {
      intervalEnd.setHours(18)
      intervalEnd.setMinutes(0)
      intervalStart.setHours(17)
      intervalStart.setMinutes(45)
    }
  }

  // return [intervalStart, intervalEnd]

  return [format(intervalStart, 'yyyy-MM-dd+HH:mm:ss').replace('+', 'T'), format(intervalEnd, 'yyyy-MM-dd+HH:mm:ss').replace('+', 'T')]
}

export function deliveryAddressIsValid(deliveryNote: SapDeliveryNoteData): boolean {
  let addressErrors = ''
  deliveryNote.AddressExtension.ShipToBuilding != undefined ? '' : (addressErrors += 'ShipToBuilding is undefined (Might be called AddressID1). <BR>')
  deliveryNote.AddressExtension.ShipToStreet != undefined ? '' : (addressErrors += 'ShipToStreet is undefined <BR>')
  deliveryNote.AddressExtension.ShipToZipCode != undefined ? '' : (addressErrors += 'ShipToZipCode is undefined <BR>')
  deliveryNote.AddressExtension.ShipToCity != undefined ? '' : (addressErrors += 'ShipToCity is undefined <BR>')
  deliveryNote.AddressExtension.ShipToCountry != undefined ? '' : (addressErrors += 'ShipToCountry is undefined <BR>')

  if (addressErrors !== '') {
    sendTeamsMessage(
      'Delivery address could not be validated',
      'DeliveryNote: **' + deliveryNote.DocNum + '**has the following errors in the address: <BR>' + addressErrors
    )
    return false
  }

  return true
}

export function correctCasing(string: string): string {
  let formattedString = ''
  const splittedString = string.split(' ')
  for (const word of splittedString) {
    formattedString += word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() + ' '
  }

  return formattedString.trim()
}
