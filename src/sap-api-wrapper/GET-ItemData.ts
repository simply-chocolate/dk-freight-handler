import { AxiosError } from 'npm:axios@1.4.0'
import { getAuthorizedClient } from './POST-login.ts'
import { sendTeamsMessage } from '../teams_notifier/SEND-teamsMessage.ts'

export type SapItemsData = {
  value: SapItemData[]
  'odata.nextLink': string
}

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
  Weight1Unit: string // 3 = kg
}

type SapItemBarCode = {
  UoMEntry: number
  Barcode: string
}

export async function getItemsData(skip?: number): Promise<SapItemsData | void> {
  const authClient = await getAuthorizedClient()

  try {
    const res = await authClient.get<SapItemsData>('ItemDatas', {
      params: {
        $select: ['ItemCode', 'ItemName', 'ItemUnitOfMeasurementCollection', 'ItemBarCodeCollection'].join(','),
        $filter: ["Valid eq 'tYES'"].join(' and '),
        $skip: skip,
        $orderby: ['CreateDate desc'].join(','),
      },
    })

    return res.data
  } catch (error) {
    if (error instanceof AxiosError) {
      await sendTeamsMessage(
        'getItemData SAP request failed',
        `**Code**: ${error.code}<BR>
          **Error Message**: ${JSON.stringify(error.response?.data)}<BR>
          **Body**: ${JSON.stringify(error.config)}<BR>`
      )
    }
  }
}

export async function getAllItemsData(): Promise<SapItemsData | void> {
  const activeItemDatas: SapItemsData = { value: [], 'odata.nextLink': '' }

  for (let page = 0; ; page++) {
    const currentPage = await getItemsData(page * 20)

    if (!currentPage) {
      break
    }
    activeItemDatas.value.push(...currentPage.value)

    if (!currentPage['odata.nextLink']) {
      break
    } else if (currentPage['odata.nextLink'] === '') {
      break
    }
  }

  return activeItemDatas
}
