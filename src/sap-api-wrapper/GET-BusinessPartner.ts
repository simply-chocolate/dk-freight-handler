import { AxiosError } from 'npm:axios@1.4.0'
import { sendTeamsMessage } from '../teams_notifier/SEND-teamsMessage.ts'
import { SapBusinessPartnerData } from './GET-BusinessPartners.ts'
import { getAuthorizedClient } from './POST-login.ts'

export async function getBusinessPartner(CardCode: string): Promise<SapBusinessPartnerData | void> {
  const authClient = await getAuthorizedClient( 'GET BusinessPartners' )

  try {
    const res = await authClient.get<SapBusinessPartnerData>(`BusinessPartners('${CardCode}')`, {
      params: {
        $select: ['CardCode', 'CardName', 'Valid', 'BPAddresses'].join(','),
        //$filter: "Valid eq 'tYES'",
      },
    })

    return res.data
  } catch (error) {
    if (error instanceof AxiosError) {
      await sendTeamsMessage(
        'getActiveBusinessPartners SAP request failed',
        `**Code**: ${error.code}<BR>
          **Error Message**: ${JSON.stringify(error.response?.data)}<BR>
          **Body**: ${JSON.stringify(error.config)}<BR>`, 
        'summary'
      )
    }
  }
}
