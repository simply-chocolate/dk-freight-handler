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

export async function getRelatedOrders(docEntries: number[], skip?: number): Promise<SapDocumentsData | void> {
  const authClient = await getAuthorizedClient()
  try {
    const res = await authClient.get<SapDocumentsData>('Orders', {
      params: {
        $select: ['DocEntry', 'DocNum'].join(','),
        $filter: 'DocEntry eq ' + docEntries.join(' or DocEntry eq '),
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
          **Body**: ${JSON.stringify(error.config)}<BR>`
      )
    }
  }
}

export async function getAllRelatedOrders(docEntries: number[]): Promise<SapDocumentsData | void> {
  const openOrders: SapDocumentsData = { value: [], 'odata.nextLink': '' }

  for (let page = 0; ; page++) {
    const currentPage = await getRelatedOrders(docEntries, page * 20)
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
