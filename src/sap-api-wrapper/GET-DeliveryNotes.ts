import { AxiosError } from 'npm:axios@1.4.0'
import { getAuthorizedClient } from './POST-login.ts'
import { sendTeamsMessage } from '../teams_notifier/SEND-teamsMessage.ts'

export type SapDeliveryNotesData = {
  value: SapDeliveryNoteData[]
  'odata.nextLink': string
}

export type SapDeliveryNoteData = {
  DocEntry: number
  DocNum: number
  DocDate: string
  DocDueDate: string
  CardCode: string
  CardName: string
  NumAtCard: string
  Comments: string
  DocumentStatus: string
  Address: string

  U_CCF_DF_ShippingProduct: 'KT1' | 'PL1' | 'PL2' | 'PL4'
  U_CCF_DF_NumberOfShippingProducts: number /* DEFAULT EMPTY - IF EMPTY: ERROR */
  U_CCF_DF_ExchangePallet: 'N' | 'Y' /* DEFAULT */
  U_CCF_DF_DOTDelivery: 'N' /* DEFAULT */ | 'Dot1' | 'Dot2' | 'Dot3' // |  'Dot4'
  U_CCF_DF_DOTIntervalStart: string // We only need the start, we can just calculate the end?
  // MIGHT COME IN HANDY SOME DAY: U_CCF_DF_DOTIntervalEnd: Date
  U_CCF_DF_DeliveryRemark: string
  U_CCF_DF_FreightBooked: 'N' | 'Y' | 'P' // P = Print label again
  U_CCF_DF_ConsignmentID: string | undefined

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
  AddressExtension: AddressExtension
}

export type AddressExtension = {
  ShipToBuilding: string // Is Company Name
  ShipToStreet: string // Street name, nr and floor
  ShipToBlock: string // Port no. etc
  ShipToZipCode: string
  ShipToCity: string
  ShipToCountry: string
  U_CCF_DF_AddressValidationS?: 'validated' | string
}

export async function getDeliveryNotes(skip?: number): Promise<SapDeliveryNotesData | void> {
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
          'U_CCF_DF_ShippingProduct',
          'U_CCF_DF_NumberOfShippingProducts',
          'U_CCF_DF_ExchangePallet',
          'U_CCF_DF_DOTDelivery',
          'U_CCF_DF_DOTIntervalStart',
          'U_CCF_DF_DeliveryRemark',
          'U_CCF_DF_FreightBooked',
          'U_CCF_DF_ConsignmentID',
          'DocumentStatus',
          'Address',
          'DocumentLines',
          'AddressExtension',
        ].join(','),
        $filter: [
          `DocDate eq ${now}`,
          "U_CCF_DF_FreightBooked ne 'Y'",
          'TransportationCode ne 14',
          "U_CCF_DF_ShippingProduct ne ''",
          'U_CCF_DF_NumberOfShippingProducts gt 0',
          "U_CCF_DF_AddressValidation eq 'validated'",
        ].join(' and '),
        $skip: skip,
      },
    })

    return res.data
  } catch (error) {
    if (error instanceof AxiosError) {
      await sendTeamsMessage(
        'getDeliveryNotes SAP request failed',
        `**Code**: ${error.code}<BR>
          **Error Message**: ${error.message}<BR>
          **Body**: ${JSON.stringify(error.config)}<BR>`
      )
    }
  }
}

export async function getAllValidatedDeliveryNotes(): Promise<SapDeliveryNotesData | void> {
  const openOrders: SapDeliveryNotesData = { value: [], 'odata.nextLink': '' }

  for (let page = 0; ; page++) {
    const currentPage = await getDeliveryNotes(page * 20)
    if (!currentPage) {
      break
    }
    openOrders.value.push(...currentPage.value)

    if (!currentPage['odata.nextLink']) {
      break
    } else if (currentPage['odata.nextLink'] === '') {
      break
    }
  }

  return openOrders
}
