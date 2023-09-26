import { ConsignmentBodyData, SenderAddress } from '../fragt-api-wrapper/POST-createConsignment.ts.ts'
import { SapDeliveryNoteData } from '../sap-api-wrapper/GET-DeliveryNotes.ts'
import { sendTeamsMessage } from '../teams_notifier/SEND-teamsMessage.ts'
import { returnDateWithHours, setDotIntervals } from './utils.ts'

export function mapSAPDataToDF(deliveryNote: SapDeliveryNoteData, orderNumber: number): ConsignmentBodyData {
  const senderAddress: SenderAddress = {
    Name: 'Copenhagen Chocolate Factory ApS',
    Street: 'Amager Landevej 123',
    Town: 'Kastrup',
    ZipCode: '2770',
    Country: 'DK',
    ContactPerson: 'Palle Jensen',
    ContactPersonPhone: '27801099',
    ContactPersonEmail: 'lager@simplychocolate.dk',
  }

  let totalWeight = 0
  for (const documentLine of deliveryNote.DocumentLines) {
    totalWeight += documentLine.Weight1
  }
  let reference = 'Følgeseddel: ' + deliveryNote.DocNum + '\n'
  let reference1 = ''
  let reference2 = ''
  let reference3 = ''
  let reference4 = ''
  let reference5 = ''

  if (deliveryNote.NumAtCard != null) {
    reference += deliveryNote.NumAtCard
  }
  if (deliveryNote.AddressExtension.ShipToBlock != null) {
    reference += '\n' + deliveryNote.AddressExtension.ShipToBlock
  }
  if (deliveryNote.U_BOYX_EKomm != null) {
    reference += '\n' + deliveryNote.U_BOYX_EKomm.toUpperCase()
  }
  if (deliveryNote.U_CCF_DF_DeliveryRemark != null) {
    reference += '\n' + deliveryNote.U_CCF_DF_DeliveryRemark
  }

  reference1 = reference.substring(0, 70)

  if (reference.length > 70) {
    reference2 = reference.substring(70, 140)
    if (reference.length > 140) {
      reference3 = reference.substring(140, 210)
      if (reference.length > 210) {
        reference4 = reference.substring(210, 280)
        if (reference.length > 280) {
          reference5 = reference.substring(280, 350)
          if (reference.length > 350) {
            sendTeamsMessage('Reference is too long', `**Delivery Note Number**: ${deliveryNote.DocNum} <BR> **Reference**: ${reference}`)
          }
        }
      }
    }
  }

  const consignmentData: ConsignmentBodyData = {
    AgreementNumber: Deno.env.get('DF_AGREEMENT_NUMBER')!,
    HubAgreement: Deno.env.get('DF_AGREEMENT_HUB')!,
    ConsignmentDate: new Date(deliveryNote.DocDate),
    WhoPays: 'Prepaid',
    ConsignmentNoteType: 'Pickup',
    ShippingType: 'PalleEnhedsForsendelse', // This will probably always be PallEnhedsForsendelse
    Goods: [
      {
        NumberOfItems: deliveryNote.U_CCF_DF_NumberOfShippingProducts == null ? 1 : deliveryNote.U_CCF_DF_NumberOfShippingProducts,
        Type: deliveryNote.U_CCF_DF_ShippingProduct,
        Description: 'Chokolade',
        Weight: Math.round(totalWeight),
      },
    ],
    Receiver: {
      Name: deliveryNote.AddressExtension.ShipToBuilding,
      Street: deliveryNote.AddressExtension.ShipToStreet,
      Town: deliveryNote.AddressExtension.ShipToCity,
      ZipCode: deliveryNote.AddressExtension.ShipToZipCode,
      Country: deliveryNote.AddressExtension.ShipToCountry,
      //ContactPerson: deliveryNote.,
    },
    PickUp: senderAddress,
    PickupTime: {
      PickupIntervalStart: returnDateWithHours(deliveryNote.DocDueDate, 14),
      PickupIntervalEnd: returnDateWithHours(deliveryNote.DocDueDate, 16),
    },
    Initiator: senderAddress,
    Sender: senderAddress,
    SenderReference: orderNumber,
    Reference1: reference1,
    Reference2: reference2,
    Reference3: reference3,
    Reference4: reference4,
    Reference5: reference5,

    PickupRemarks: deliveryNote.Comments,
  }

  if (deliveryNote.U_CCF_DF_DOTDelivery !== 'N') {
    const [intervalStart, intervalEnd] = setDotIntervals(deliveryNote.DocDueDate, deliveryNote.U_CCF_DF_DOTIntervalStart, deliveryNote.U_CCF_DF_DOTDelivery)

    consignmentData.DeliveryTime = {
      DotIntervalStart: intervalStart,
      DotIntervalEnd: intervalEnd,
      DotType: deliveryNote.U_CCF_DF_DOTDelivery,
    }
  }

  return consignmentData
}
