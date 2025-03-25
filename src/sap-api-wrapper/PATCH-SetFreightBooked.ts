import { AxiosError, AxiosResponse } from 'npm:axios@1.4.0'
import { getAuthorizedClient } from './POST-login.ts'
import { sendTeamsMessage } from '../teams_notifier/SEND-teamsMessage.ts'

export async function setFreightBooked(docEntry: number, deliveryNote: number): Promise<AxiosResponse | void> {
  const authClient = await getAuthorizedClient( 'PATCH FreightBooked DeliveryNotes' )

  try {
    const res = await authClient.patch(`DeliveryNotes(${docEntry})`, {
      U_CCF_DF_FreightBooked: 'Y',
    })

    return res.data
  } catch (error) {
    if (error instanceof AxiosError) {
      await sendTeamsMessage(
        'setFreightBooked SAP request failed',
        `**DeliveryNote**: ${deliveryNote}<BR>
        **Code**: ${error.code}<BR>
          **Error Message**: ${JSON.stringify(error.response?.data)}<BR>
          **Body**: ${JSON.stringify(error.config)}<BR>`,
        'summary'
      )
    }
    console.log(`Error in setFreightBooked, just marking as freight booked. DeliveryNote: ${deliveryNote}`)
    await setFreightBooked(docEntry, deliveryNote)
  }
}
