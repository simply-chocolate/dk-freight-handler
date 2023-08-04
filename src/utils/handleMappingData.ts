import { ConsignmentBodyData, SenderAddress } from '../fragt-api-wrapper/POST-createConsignment.ts.ts'
import { SapDeliveryNoteData } from '../sap-api-wrapper/GET-DeliveryNotes.ts'
import { returnDateWithHours, setDotIntervals } from './utils.ts'

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
        NumberOfItems:
          deliveryNote.U_CCF_DF_NumberOfShippingProducts == null
            ? 1
            : deliveryNote.U_CCF_DF_NumberOfShippingProducts,
        Type: deliveryNote.U_CCF_DF_ShippingProduct,
        Description: 'Chokolade',
        Weight: Math.round(totalWeight),
      },
    ],
    Receiver: {
      Name: deliveryNote.AddressExtension.ShipToBuilding,
      Street: deliveryNote.AddressExtension.ShipToStreet
        ? deliveryNote.AddressExtension.ShipToStreet
        : deliveryNote.AddressExtension.ShipToBlock,
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
    PickupRemarks: deliveryNote.Comments,

    DeliveryRemark: deliveryNote.U_CCF_DF_DeliveryRemark,
  }

  if (deliveryNote.U_CCF_DF_DOTDelivery !== 'N') {
    const [intervalStart, intervalEnd] = setDotIntervals(
      deliveryNote.DocDueDate,
      deliveryNote.U_CCF_DF_DOTIntervalStart,
      deliveryNote.U_CCF_DF_DOTDelivery
    )

    consignmentData.DeliveryTime = {
      DotIntervalStart: intervalStart,
      DotIntervalEnd: intervalEnd,
      DotType: deliveryNote.U_CCF_DF_DOTDelivery,
    }
  }

  return consignmentData
}
