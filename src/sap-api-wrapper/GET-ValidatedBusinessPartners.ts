import { AxiosError } from 'npm:axios@1.4.0'
import { getAuthorizedClient } from './POST-login.ts'
import { sendTeamsMessage } from '../teams_notifier/SEND-teamsMessage.ts'

export type SapValidatedBusinessPartnersData = {
  value: SapValidatedBusinessPartnerData[]
  'odata.nextLink': string
}

export type SapValidatedBusinessPartnerData = {
  CardCode: string
  U_CCF_DF_AddressesValidated: string
  U_CCF_DF_LastSuccessValidationDate: string
  UpdateDate: string
}

export async function getValidatedBusinessPartners(skip?: number): Promise<SapValidatedBusinessPartnersData | void> {
  const authClient = await getAuthorizedClient()

  try {
    const res = await authClient.get<SapValidatedBusinessPartnersData>('BusinessPartners', {
      params: {
        $select: ['CardCode', 'U_CCF_DF_AddressesValidated', 'U_CCF_DF_LastSuccessValidationDate', 'UpdateDate'].join(','),
        $filter: ["U_CCF_DF_AddressesValidated eq 'Y'", 'U_CCF_DF_LastSuccessValidationDate lt UpdateDate'].join(' and '),
        $skip: skip,
      },
    })

    return res.data
  } catch (error) {
    if (error instanceof AxiosError) {
      await sendTeamsMessage(
        'getValidatedBusinessPartners SAP request failed',
        `**Code**: ${error.code}<BR>
          **Error Message**: ${JSON.stringify(error.response?.data)}<BR>
          **Body**: ${JSON.stringify(error.config)}<BR>`
      )
    }
  }
}

export async function getAllValidatedBusinessPartners(): Promise<SapValidatedBusinessPartnersData | void> {
  const validatedBusinessPartners: SapValidatedBusinessPartnersData = { value: [], 'odata.nextLink': '' }

  for (let page = 0; ; page++) {
    const currentPage = await getValidatedBusinessPartners(page * 20)
    if (!currentPage) {
      break
    }
    validatedBusinessPartners.value.push(...currentPage.value)

    if (!currentPage['odata.nextLink']) {
      break
    } else if (currentPage['odata.nextLink'] === '') {
      break
    }
  }

  return validatedBusinessPartners
}
