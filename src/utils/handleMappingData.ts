import { ConsignmentBodyData, SenderAddress } from '../fragt-api-wrapper/POST-createConsignment.ts.ts'
import { SapDeliveryNoteData } from '../sap-api-wrapper/GET-DeliveryNotes.ts'
import { returnDateWithHours } from './utils.ts'

export function mapSAPDataToDF(deliveryNote: SapDeliveryNoteData): ConsignmentBodyData {
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

  const consignmentData: ConsignmentBodyData = {
    AgreementNumber: Deno.env.get('DF_AGREEMENT_NUMBER')!,
    HubAgreement: Deno.env.get('DF_AGREEMENT_HUB')!,
    ConsignmentDate: new Date(deliveryNote.DocDate),
    WhoPays: 'Prepaid',
    ConsignmentNoteType: 'Pickup',
    ShippingType: 'PalleEnhedsForsendelse', // This will probably always be PallEnhedsForsendelse
    Goods: [
      {
        NumberOfItems: 1, // deliveryNote.U_CCF_NumberOfShippingProducts, // TODO: Use SAP Field when created
        Type: 'PL1', // deliveryNote.U_CCF_ShippingProduct , // TODO: Use SAP Field when created
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
    },
    PickUp: senderAddress,
    PickupTime: {
      PickupIntervalStart: returnDateWithHours(deliveryNote.DocDueDate, 14),
      PickupIntervalEnd: returnDateWithHours(deliveryNote.DocDueDate, 16),
    },
    Initiator: senderAddress,
    Sender: senderAddress,
    SenderReference: deliveryNote.DocNum,
    Reference1: deliveryNote.NumAtCard,
    // TODO: DeliveryRemark: customer.DeliveryRemark or something like that,
  }
  /*
    if (deliveryNote.U_CCF_DOTDelivery !== 'N') {
      consignmentData.DeliveryTime = {
        DotIntervalStart:,
        DotIntervalEnd: ,
        DotType: deliveryNote.U_CCF_DOTDelivery,
      }
    }
  */
  return consignmentData
}
