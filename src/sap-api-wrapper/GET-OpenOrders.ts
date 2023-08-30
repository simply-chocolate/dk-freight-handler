import { AxiosError } from 'npm:axios@1.4.0'
import { getAuthorizedClient } from './POST-login.ts'
import { sendTeamsMessage } from '../teams_notifier/SEND-teamsMessage.ts'
import { AddressExtension } from './GET-DeliveryNotes.ts'

export type SapOrdersData = {
  value: SapOrderData[]
  'odata.nextLink': string
}

export type SapOrderData = {
  DocEntry: number
  DocNum: number
  DocDate: string
  DocDueDate: string
  CardCode: string
  CardName: string
  DocumentStatus: string
  U_CCF_DF_AddressValidation: 'validated' | string
  AddressExtension: AddressExtension
}

export async function getOpenOrders(skip?: number): Promise<SapOrdersData | void> {
  const authClient = await getAuthorizedClient()
  try {
    const res = await authClient.get<SapOrdersData>('Orders', {
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
          'U_CCF_DF_AddressValidation',
          'DocumentStatus',
          'AddressExtension',
        ].join(','),
        $filter: [
          "(U_CCF_DF_AddressValidation ne 'validated' or U_CCF_DF_AddressValidation eq NULL)",
          "DocumentStatus eq 'bost_Open'",
          'TransportationCode ne 14',
          "Confirmed eq 'tYES'",
          "not startswith(CardName, 'shop.simply')",
          // And CardName not like "shop.simply" or "amazon"
        ].join(' and '),
        $skip: skip,
      },
    })

    return res.data
  } catch (error) {
    if (error instanceof AxiosError) {
      sendTeamsMessage(
        'getOpenOrders SAP request failed',
        `**Code**: ${error.code}<BR>
          **Error Message**: ${JSON.stringify(error.response?.data)}<BR>
          **Body**: ${JSON.stringify(error.config)}<BR>`
      )
    }
  }
}

export async function getAllOpenOrders(): Promise<SapOrdersData | void> {
  const openOrders: SapOrdersData = { value: [], 'odata.nextLink': '' }

  for (let page = 0; ; page++) {
    const currentPage = await getOpenOrders(page * 20)
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
