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
  U_CCF_ShippingProduct: 'KT1' | 'PL1' | 'PL2' | 'PL4'
  U_CCF_NumberOfShippingProducts: number

  U_CCF_FreightBooked: 'N' | 'Y'

  // TODO: Should these be on the customer??
  U_CCF_ExchangePallet: 'N' | 'Y'
  U_CCF_DOTDelivery: 'N' | 'Dot1' | 'Dot2' | 'Dot3' | 'Dot4'
  U_CCF_DOTIntervalStart: Date
  U_CCF_DOTIntervalEnd: Date

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
        $filter: `DocDate eq '${now}'`,
      },
    })

    return res.data
  } catch (error) {
    if (error instanceof AxiosError) {
      console.log(error.config)
      sendTeamsMessage(
        'getDeliveryNotes SAP request failed',
        `**Code**: ${error.response?.data.error.code}<BR>
          **Error Message**: ${error.response?.data.error.message.value}<BR>`
      )
    }
  }
}
