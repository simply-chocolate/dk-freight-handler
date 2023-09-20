import { AxiosError } from 'npm:axios@1.4.0'
import { getAuthorizedClient } from './POST-login.ts'
import { sendTeamsMessage } from '../teams_notifier/SEND-teamsMessage.ts'

export type SapBusinessPartnersData = {
  value: SapBusinessPartnerData[]
  'odata.nextLink': string
}

export type SapBusinessPartnerData = {
  CardCode: string
  CardName: string
  // TODO: Add a field on BusinessPartner Level to indicate if an address needs validation. Default should be Yes.
  // TODO: Add a field on BusinessPartner Level to indicate when an address was last validated.
  // TODO: Add a function that checks if a customer was updated later than the address was last validated.
  BPAddresses: SapBusinessPartnerAddress[]
}

export type SapBusinessPartnerAddress = {
  AddressName: string
  Street: string // Street name and number
  Block: string // Port / Delivery Instructions
  City: string
  ZipCode: string
  Country: string
  AddressType: 'bo_BillTo' | 'bo_ShipTo'
  U_CCF_DF_AddressValidation: 'validated' | string
}

export async function getActiveBusinessPartners(skip?: number): Promise<SapBusinessPartnersData | void> {
  const authClient = await getAuthorizedClient()

  try {
    const res = await authClient.get<SapBusinessPartnersData>('BusinessPartners', {
      params: {
        $select: ['CardCode', 'CardName', 'BPAddresses'].join(','),
        $filter: [
          "Valid eq 'tYES'",
          'ShippingType ne 14',
          "CardType eq 'cCustomer'",
          "(U_CCF_DF_AddressesValidated ne 'Y' or U_CCF_DF_AddressesValidated eq NULL)",
        ].join(' and '),
        $skip: skip,
        $orderby: ['CreateDate desc'].join(','),
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

export async function getAllActiveBusinessPartners(): Promise<SapBusinessPartnersData | void> {
  const activeBusinessPartners: SapBusinessPartnersData = { value: [], 'odata.nextLink': '' }

  for (let page = 0; ; page++) {
    const currentPage = await getActiveBusinessPartners(page * 20)

    if (!currentPage) {
      break
    }
    activeBusinessPartners.value.push(...currentPage.value)

    if (!currentPage['odata.nextLink']) {
      break
    } else if (currentPage['odata.nextLink'] === '') {
      break
    }
    console.log(`Page ${page} has nextlinke ${currentPage['odata.nextLink']}`)
  }

  return activeBusinessPartners
}
