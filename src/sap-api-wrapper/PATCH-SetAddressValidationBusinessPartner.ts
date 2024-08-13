import { AxiosError, AxiosResponse } from 'npm:axios@1.4.0'
import { getAuthorizedClient } from './POST-login.ts'
import { sendTeamsMessage } from '../teams_notifier/SEND-teamsMessage.ts'
import { SapBusinessPartnerAddress } from './GET-BusinessPartners.ts'

export async function setAddressValidationBusinessPartner(
  CardCode: string,
  allAddressesValidated: boolean | null,
  BPAddresses?: SapBusinessPartnerAddress[]
): Promise<AxiosResponse | void> {
  const authClient = await getAuthorizedClient( 'PATCH address validation BusinessPartners' )

  try {
    if (BPAddresses === undefined) {
      const res = await authClient.patch(`BusinessPartners('${CardCode}')`, {
        U_CCF_DF_AddressesValidated: allAddressesValidated ? 'Y' : 'N',
      })

      return res.data
    } else if (!allAddressesValidated) {
      const res = await authClient.patch(`BusinessPartners('${CardCode}')`, {
        U_CCF_DF_AddressesValidated: allAddressesValidated ? 'Y' : 'N',
        BPAddresses: BPAddresses,
      })

      return res.data
    } else if (allAddressesValidated === null) {
      const res = await authClient.patch(`BusinessPartners('${CardCode}')`, {
        BPAddresses: BPAddresses,
      })

      return res.data
    } else {
      const res = await authClient.patch(`BusinessPartners('${CardCode}')`, {
        U_CCF_DF_AddressesValidated: allAddressesValidated ? 'Y' : 'N',
        U_CCF_DF_LastSuccessValidationDate: new Date().toISOString().split('T')[0],
        BPAddresses: BPAddresses,
      })

      return res.data
    }
  } catch (error) {
    if (error instanceof AxiosError) {
      await sendTeamsMessage(
        'setAddressValidationBusinessPartner SAP request failed',
        `**CardCode**: ${CardCode}<BR>
        **Code**: ${error.code}<BR>
          **Error Message**: ${JSON.stringify(error.response?.data)}<BR>
          **Body**: ${JSON.stringify(error.config)}<BR>`,
        'summary'
      )
    }
  }
}
