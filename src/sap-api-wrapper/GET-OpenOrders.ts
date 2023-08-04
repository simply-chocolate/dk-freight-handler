import { AxiosError } from 'npm:axios@1.4.0'
import { getAuthorizedClient } from './POST-login.ts'
import { sendTeamsMessage } from '../teams_notifier/SEND-teamsMessage.ts'
import { AddressExtension } from './GET-DeliveryNotes.ts'

export type SapOrdersData = {
  value: SapOrderData[]
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

export async function getOpenOrders(): Promise<SapOrdersData | void> {
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
          'U_CCF_AddressValidation',
          'DocumentStatus',
          'AddressExtension',
        ].join(','),
        $filter: ["U_CCF_AddressValidation ne 'validated'", "DocumentStatus eq 'bost_Open'"].join(' and '),
      },
    })

    return res.data
  } catch (error) {
    if (error instanceof AxiosError) {
      sendTeamsMessage(
        'getOpenOrders SAP request failed',
        `**Code**: ${error.code}<BR>
          **Error Message**: ${error.message}<BR>
          **Body**: ${JSON.stringify(error.config)}<BR>`
      )
    }
  }
}
