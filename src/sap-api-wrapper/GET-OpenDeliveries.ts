import { AxiosError } from 'npm:axios@1.4.0'
import { sendTeamsMessage } from '../teams_notifier/SEND-teamsMessage.ts'
import { SapDocumentsData } from './GET-OpenOrders.ts'
import { getAuthorizedClient } from './POST-login.ts'

export async function getOpenDeliveryNotes(skip?: number): Promise<SapDocumentsData | void> {
  const authClient = await getAuthorizedClient()
  try {
    const res = await authClient.get<SapDocumentsData>('DeliveryNotes', {
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
        ].join(' and '),
        $skip: skip,
      },
    })

    return res.data
  } catch (error) {
    if (error instanceof AxiosError) {
      sendTeamsMessage(
        'getDeliveryNotes SAP request failed',
        `**Code**: ${error.code}<BR>
          **Error Message**: ${JSON.stringify(error.response?.data)}<BR>
          **Body**: ${JSON.stringify(error.config)}<BR>`
      )
    }
  }
}

export async function getAllOpenDeliveryNotes(): Promise<SapDocumentsData | void> {
  const openDeliveryNotes: SapDocumentsData = { value: [], 'odata.nextLink': '' }

  for (let page = 0; ; page++) {
    const currentPage = await getOpenDeliveryNotes(page * 20)
    if (!currentPage) {
      break
    }
    openDeliveryNotes.value.push(...currentPage.value)

    if (!currentPage['odata.nextLink']) {
      break
    } else if (currentPage['odata.nextLink'] === '') {
      break
    }
  }

  return openDeliveryNotes
}
