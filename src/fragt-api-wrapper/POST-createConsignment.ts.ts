import { AxiosError } from 'axios'
import { getDFSession } from './POST-login.ts'
import { sendTeamsMessage } from '../teams_notifier/SEND-teamsMessage.ts'

export type ConsignmentBodyData = {
  AgreementNumber: string
  HubAgreement: string

  ConsignmentDate?: Date
  ConsignmentNoteType?: 'Pickup' | 'Return'
  ProductCode?: 'DayB' | 'DayP' // | 'NightB' | 'NightP' | 'ParcelShop'
  PickupTime?: {
    PickupIntervalStart: string
    PickupIntervalEnd: string
  }
  DeliveryTime?: {
    DotIntervalStart: string
    DotIntervalEnd: string
    DotType:
      | 'Dot1' // 07:00-10:00 Rule:  Before 10 AM.
      | 'Dot2' // 09:00-15:00 Rule: Delivery within a time frame of 2 hours.
      | 'Dot3' // 06:00-17:00 Rule: Delivery at a given time +/- 15 minutes.
      | 'Dot4' // 17:00-22:00 Rule: Delivery at a given time +/- 15 minutes.
  }
  WhoPays: 'Prepaid' | 'Collect'
  ShippingType: 'PalleEnhedsForsendelse'
  Goods: [
    {
      NumberOfItems: number
      Type: 'KT1' | 'PL1' | 'PL2' | 'PL4'
      Description: string
      Weight: number
    }
  ]

  SenderReference: number
  Reference1?: string // For numAtCard
  Sender: SenderAddress
  PickUp: SenderAddress

  Initiator: SenderAddress
  PickupRemarks?: string

  DeliveryRemark?: string
  DeliveryRemark2?: string
  DeliveryRemark3?: string
  DeliveryRemark4?: string
  DeliveryRemark5?: string

  Receiver: {
    Name: string
    Street: string
    Town: string
    ZipCode: string
    Country: string
    ContactPerson?: string
    ContactPersonEmail?: string
    ContactPersonPhone?: string
  }
}

export type SenderAddress = {
  Name: string | 'Copenhagen Chocolate Factory ApS'
  Street: string | 'Amager Landevej 123'
  Town: string | 'Kastrup'
  ZipCode: string | '2770'
  Country: string | 'DK'
  ContactPerson: string | 'Palle Jensen'
  ContactPersonEmail: string | 'lager@simplychocolate.dk'
  ContactPersonPhone: string | '27801099'
}

export async function createConsignment(body: ConsignmentBodyData, deliveryNote: number): Promise<void | string> {
  const session = await getDFSession()
  try {
    const res = await session.post('v1/Consignments', body)
    return res.data.ConsignmentNumber
  } catch (error) {
    if (error instanceof AxiosError) {
      await sendTeamsMessage(
        'createConsignment DF request failed',
        `**DeliveryNote**: ${deliveryNote}<BR>
          **Code**: ${error.code}<BR>
          **Error**: ${JSON.stringify(error.response?.data)}<BR>
          **Body**: ${JSON.stringify(error.config?.data)}<BR>
          `
      )
    }
    return
  }
}
