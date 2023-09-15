import { AxiosError, AxiosResponse } from 'npm:axios@1.4.0'
import { getAuthorizedClient } from './POST-login.ts'
import { sendTeamsMessage } from '../teams_notifier/SEND-teamsMessage.ts'
import { SapBusinessPartnerAddress } from './GET-BusinessPartners.ts'

export async function setAddressValidationBusinessPartner(CardCode: string, BPAddresses: SapBusinessPartnerAddress[]): Promise<AxiosResponse | void> {
  const authClient = await getAuthorizedClient()

  try {
    const res = await authClient.patch(`BusinessPartners('${CardCode}')`, {
      BPAddresses: BPAddresses,
    })

    return res.data
  } catch (error) {
    if (error instanceof AxiosError) {
      sendTeamsMessage(
        'setAddressValidationBusinessPartner SAP request failed',
        `**CardCode**: ${CardCode}<BR>
        **Code**: ${error.code}<BR>
          **Error Message**: ${JSON.stringify(error.response?.data)}<BR>
          **Body**: ${JSON.stringify(error.config)}<BR>`
      )
    }
  }
}
