import { AxiosError } from 'npm:axios@1.4.0'
import { getAuthorizedClient } from './POST-login.ts'
import { sendTeamsMessage } from '../teams_notifier/SEND-teamsMessage.ts'
import { SapBusinessPartnersData } from './GET-BusinessPartners.ts'

export async function getBusinessPartner(CardCode: string): Promise<SapBusinessPartnersData | void> {
  const authClient = await getAuthorizedClient()

  try {
    const res = await authClient.get<SapBusinessPartnersData>('BusinessPartners', {
      params: {
        $select: ['CardCode', 'CardName', 'BPAddresses'].join(','),
        $filter: [`CardCode eq '${CardCode}'`].join(' and '),
      },
    })

    return res.data
  } catch (error) {
    if (error instanceof AxiosError) {
      await sendTeamsMessage(
        'getActiveBusinessPartners SAP request failed',
        `**Code**: ${error.code}<BR>
          **Error Message**: ${JSON.stringify(error.response?.data)}<BR>
          **Body**: ${JSON.stringify(error.config)}<BR>`
      )
    }
  }
}
