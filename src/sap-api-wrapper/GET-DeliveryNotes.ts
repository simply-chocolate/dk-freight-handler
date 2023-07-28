import { AxiosError } from 'npm:axios@1.4.0'
import { getAuthorizedClient } from './POST-login.ts'
import { sendTeamsMessage } from '../teams_notifier/SEND-teamsMessage.ts'

export type SapDeliveryNotesData = {
  value: SapDeliveryNoteData[]
}

export type SapDeliveryNoteData = {
  DocEntry: number
  DocNum: number
  DocDate: Date
  DocDueDate: string
  CardCode: string
  CardName: string
  NumAtCard: string
  Comments: string
  DocumentStatus: string
  Address: string

  // TODO: Create the fields in SAP
  U_CCF_DF_ShippingProduct: 'KT1' /* DEFAULT */ | 'PL1' | 'PL2' | 'PL4'
  U_CCF_DF_NumberOfShippingProducts: number /* DEFAULT EMPTY - IF EMPTY: Assume 1 */
  U_CCF_DF_ExchangePallet: 'N' | 'Y' /* DEFAULT */
  U_CCF_DF_DOTDelivery: 'N' /* DEFAULT */ | 'Dot1' | 'Dot2' | 'Dot3' // |  'Dot4'
  U_CCF_DF_DOTIntervalStart: Date // We only need the start, we can just calculate the end?
  U_CCF_DF_DOTIntervalEnd: Date

  // These two are something we send back to SAP after the delivery is booked
  U_CCF_DF_FreightBooked: 'N' | 'Y'
  U_CCF_DF_TrackAndTrace: string

  DocumentLines: [
    {
      ItemCode: string
      ItemDescription: string
      Quantity: number
      Weight1: number
      Weight1Unit: number // 3 = Kilos
    }
  ]
  // The names of these fields are not always containing the data you'd think they would
  AddressExtension: {
    ShipToBuilding: string // Is Company Name
    ShipToStreet: string
    ShipToStreetNo: string
    ShiptopBlock: string
    ShipToZipCode: string
    ShipToCity: string
    ShipToCountry: string
  }
}

export async function getDeliveryNotes(): Promise<SapDeliveryNotesData | void> {
  const authClient = await getAuthorizedClient()
  const now = new Date(new Date().getTime()).toISOString().split('T')[0]

  try {
    const res = await authClient.get<SapDeliveryNotesData>('DeliveryNotes', {
      params: {
        $select: [
          'DocEntry',
          'DocNum',
          'DocDate',
          'DocDueDate',
          'CardCode',
          'CardName',
          'NumAtCard',
          'Comments',
          'DocumentStatus',
          'Address',
          'DocumentLines',
          'AddressExtension',
        ].join(','),
        $filter: `DocDate eq '${now}'`, // TODO: Might need to change the track&trace filter to "IsBooked"
        // U_CCF_DF_FreightBooked: 'Y' | 'N' | 'P' (Print label again),
        // U_CCF_DF_ConsignementID: string | number
        // We might need to store the consignmeent ID from DF in SAP as well, so we can print out a label thats already been handled
      },
    })

    return res.data
  } catch (error) {
    if (error instanceof AxiosError) {
      sendTeamsMessage(
        'getDeliveryNotes SAP request failed',
        `**Code**: ${error.response?.data.error.code}<BR>
          **Error Message**: ${error.response?.data.error.message.value}<BR>
          **Body**: ${JSON.stringify(error.config)}<BR>`
      )
    }
  }
}
