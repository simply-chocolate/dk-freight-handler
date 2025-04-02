import { AxiosError } from 'npm:axios@1.4.0'
import { getAuthorizedClient } from './POST-login.ts'
import { sendTeamsMessage } from '../teams_notifier/SEND-teamsMessage.ts'
import { AddressExtension } from './GET-DeliveryNotes.ts'

export type SapDocumentsData = {
  value: SapDocumentData[]
  'odata.nextLink': string
}

export type SapDocumentData = {
  DocEntry: number
  DocNum: number
  DocDate: string
  DocDueDate: string
  CardCode: string
  CardName: string
  DocumentStatus: string
  U_CCF_DF_AddressValidation: 'validated' | string
  AddressExtension: AddressExtension
  U_CCF_DF_ValidationTime: string
  U_CCF_DF_ValidationDate: string
  UpdateTime: string
  UpdateDate: string
}

export async function getOpenOrders(skip?: number): Promise<SapDocumentsData | void> {
  const authClient = await getAuthorizedClient( 'GET OpenOrders' )
  try {
    const res = await authClient.get<SapDocumentsData>('Orders', {
      params: {
        $select: [
          'DocEntry',
          'DocNum',
          'DocDate',
          'DocDueDate',
          'CardCode',
          'CardName',
          'Comments',
          'U_CCF_DF_AddressValidation',
          'DocumentStatus',
          'AddressExtension',
          'U_CCF_DF_ValidationTime',
          'U_CCF_DF_ValidationDate',
          'UpdateTime',
          'UpdateDate',
        ].join(','),
        $filter: [
          "(U_CCF_DF_AddressValidation ne 'validated' or U_CCF_DF_AddressValidation eq NULL)",
          "DocumentStatus eq 'bost_Open'",
          'TransportationCode ne 14',
          "Confirmed eq 'tYES'",
          "not startswith(CardName, 'shop.simply')",
          '(UpdateDate ge U_CCF_DF_ValidationDate or U_CCF_DF_ValidationDate eq NULL)',
        ].join(' and '),
        $skip: skip,
      },
    })

    return res.data
  } catch (error) {
    if (error instanceof AxiosError) {
      await sendTeamsMessage(
        'getOpenOrders SAP request failed',
        `**Code**: ${error.code}<BR>
          **Error Message**: ${JSON.stringify(error.response?.data)}<BR>
          **Body**: ${JSON.stringify(error.config)}<BR>`,
        'summary'
      )
    }
  }
}

export async function getAllOpenOrders(): Promise<SapDocumentsData | void> {
  const openOrders: SapDocumentsData = { value: [], 'odata.nextLink': '' }

  for (let page = 0; ; page++) {
    console.log(`Fetching page ${page + 1} of open orders...`)
    const currentPage = await getOpenOrders(page * 20)
    if (!currentPage) {
      break
    }
    
    openOrders.value.push(...currentPage.value)

    if (!currentPage['odata.nextLink']) {
      console.log('No more pages to fetch.')
      break
    } else if (currentPage['odata.nextLink'] === '') {
      console.log('No more pages to fetch.2')
      break
    }
  }

  return openOrders
}
