// TODO: Take the delivery notes as an argument, and create a string containing all the customer numbers from the delivery notes
// Use this string to get the customer data from SAP
// USe the array + join method that Morten showed me

import { AxiosError } from 'axios'
import { getAuthorizedClient } from './POST-login.ts'
import { sendTeamsMessage } from '../teams_notifier/SEND-teamsMessage.ts'
import { SapDeliveryNotesData } from './GET-DeliveryNotes.ts'

type SapCustomersData = {
  value: SapCustomerData[]
}

type SapCustomerData = {
  CardCode: string
  CardName: string
  ShippingType: number // 15: DF API
  CustomeType: 'Business' | 'Private' // TODO: Figure out a way to distinguish between business and private customers from SAP
}

export async function getCustomers(deliveryNotes: SapDeliveryNotesData): Promise<SapCustomersData | void> {
  const customerNumbers: string[] = []

  for (const deliveryNote of deliveryNotes.value) {
    if (customerNumbers.includes(deliveryNote.CardCode)) {
      continue
    }

    if (deliveryNote.AddressExtension.ShipToCountry !== 'DK') {
      console.log(
        "Delivery note isn't for Denmark. Delivery note:" +
          deliveryNote.DocNum +
          ' customer ' +
          deliveryNote.CardCode
      )
    }

    customerNumbers.push(deliveryNote.CardCode)
  }

  const authClient = await getAuthorizedClient()
  try {
    const res = await authClient.get<SapCustomersData>('BusinessPartners', {
      params: {
        $select: ['CardCode', 'CardName', 'ShippingType'].join(','),
        $filter: customerNumbers.map((customerNumber) => `CardCode eq '${customerNumber}'`).join(' or '),
      },
    })

    return res.data
  } catch (error) {
    if (error instanceof AxiosError) {
      sendTeamsMessage(
        'getCustomers SAP request failed',
        `**Code**: ${error.response?.data.error.code}<BR>
          **Error Message**: ${error.response?.data.error.message.value}<BR>
          **Body**: ${JSON.stringify(error.config)}<BR>`
      )
    }
  }
}
