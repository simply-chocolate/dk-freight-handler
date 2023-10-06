import { AxiosError } from 'npm:axios@1.4.0'
import { getAuthorizedClient } from './POST-login.ts'
import { sendTeamsMessage } from '../teams_notifier/SEND-teamsMessage.ts'

export type SapStockTransfersData = {
  value: SapStockTransferData[]
  'odata.nextLink': string
}

export type SapStockTransferData = {
  DocEntry: number
  DocNum: number
  DocDate: string
  DueDate: string
  CardCode: string
  CardName: string
  Comments: string
  ShipToCode: string

  U_BOYX_EKomm: string
  U_CCF_DF_ShippingProduct: 'KT1' | 'PL1' | 'PL2' | 'PL4'
  U_CCF_DF_NumberOfShippingProducts: number /* DEFAULT EMPTY - IF EMPTY: ERROR */
  U_CCF_DF_ExchangePallet: 'N' | 'Y' /* DEFAULT */
  U_CCF_DF_DOTDelivery: 'N' /* DEFAULT */ | 'Dot1' | 'Dot2' | 'Dot3' // |  'Dot4'
  U_CCF_DF_DOTIntervalStart: string // We only need the start, we can just calculate the end?
  // MIGHT COME IN HANDY SOME DAY: U_CCF_DF_DOTIntervalEnd: Date
  U_CCF_DF_DeliveryRemark: string
  U_CCF_DF_FreightBooked: 'N' | 'Y' | 'P' // P = Print label again
  U_CCF_DF_ConsignmentID: string | undefined

  StockTransferLines: [
    {
      ItemCode: string
      ItemDescription: string
      Quantity: number
      FromWarehouseCode: string
      UseBaseUnits: 'tYES'
      MeasureUnit: string
      UoMEntry: number
      UoMCode: string
      BaseEntry: number
    }
  ]
}

export async function getStockTransfers(skip?: number): Promise<SapStockTransfersData | void> {
  const authClient = await getAuthorizedClient()
  const now = new Date(new Date().getTime()).toISOString().split('T')[0]

  try {
    const res = await authClient.get<SapStockTransfersData>('StockTransfers', {
      params: {
        $select: [
          'DocEntry',
          'DocNum',
          'DocDate',
          'DueDate',
          'CardCode',
          'CardName',
          'Comments',
          'U_BOYX_EKomm',
          'ShipToCode',
          'U_CCF_DF_ShippingProduct',
          'U_CCF_DF_NumberOfShippingProducts',
          'U_CCF_DF_ExchangePallet',
          'U_CCF_DF_DOTDelivery',
          'U_CCF_DF_DOTIntervalStart',
          'U_CCF_DF_DeliveryRemark',
          'U_CCF_DF_FreightBooked',
          'U_CCF_DF_ConsignmentID',
          'StockTransferLines',
        ].join(','),
        $filter: [
          `DocDate eq ${now}`,
          "U_CCF_DF_FreightBooked ne 'Y'",
          'CardCode ne null',
          "U_CCF_DF_ShippingProduct ne ''",
          'U_CCF_DF_NumberOfShippingProducts gt 0',
        ].join(' and '),
        $skip: skip,
      },
    })

    return res.data
  } catch (error) {
    if (error instanceof AxiosError) {
      await sendTeamsMessage(
        'getStockTransfers SAP request failed',
        `**Code**: ${error.code}<BR>
          **Error Message**: ${JSON.stringify(error.response?.data)}<BR>
          **Body**: ${JSON.stringify(error.config)}<BR>`
      )
    }
  }
}

export async function getAllStockTransfers(): Promise<SapStockTransfersData | void> {
  const openOrders: SapStockTransfersData = { value: [], 'odata.nextLink': '' }

  for (let page = 0; ; page++) {
    const currentPage = await getStockTransfers(page * 20)
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
