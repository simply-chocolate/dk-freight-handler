import { AxiosError } from 'npm:axios@1.4.0'
import { getAuthorizedClient } from './POST-login.ts'
import { sendTeamsMessage } from '../teams_notifier/SEND-teamsMessage.ts'

export type SapItemData = {
  ItemCode: string
  ItemName: string
  ItemUnitOfMeasurementCollection: SapItemUnitOfMeasurement[]
  ItemBarCodeCollection: SapItemBarCode[]
}

type SapItemUnitOfMeasurement = {
  UoMType: string
  UoMEntry: number
  Weight1: number
  Weight1Unit: number // 3 = kg
}

type SapItemBarCode = {
  UoMEntry: number
  Barcode: string
}

export async function getItemData(itemCode: string): Promise<SapItemData | void> {
  const authClient = await getAuthorizedClient( 'GET Items' )

  try {
    const res = await authClient.get<SapItemData>(`Items('${itemCode}')`, {
      params: {
        $select: ['ItemCode', 'ItemName', 'ItemUnitOfMeasurementCollection', 'ItemBarCodeCollection'].join(','),
      },
    })

    return res.data
  } catch (error) {
    if (error instanceof AxiosError) {
      await sendTeamsMessage(
        'getItemData SAP request failed',
        `**Code**: ${error.code}<BR>
          **Error Message**: ${JSON.stringify(error.response?.data)}<BR>
          **Body**: ${JSON.stringify(error.config)}<BR>`, 
        'summary'
      )
    }
  }
}
