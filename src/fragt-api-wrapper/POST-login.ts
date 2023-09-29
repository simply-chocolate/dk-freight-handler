import axios, { AxiosError, AxiosInstance } from 'axios'
import { sleep } from '../utils/sleep.ts'
import { sendTeamsMessage } from '../teams_notifier/SEND-teamsMessage.ts'

type SuccessDataType = {
  access_token: string
  token_type: string
  expires_in: number
}

export async function getDFSession(): Promise<AxiosInstance> {
  for (let retryCount = 0; retryCount < 3; retryCount++) {
    try {
      const res = await axios<SuccessDataType>({
        method: 'post',
        baseURL: Deno.env.get('DF_AUTH_URL'),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: {
          client_id: Deno.env.get('DF_CLIENT_ID'),
          grant_type: 'password',
          Username: Deno.env.get('DF_USERNAME'),
          Password: Deno.env.get('DF_PASSWORD'),
          Resource: Deno.env.get('DF_RESOURCE'),
        },
      })

      return axios.create({
        baseURL: Deno.env.get('DF_RESOURCE'),
        headers: {
          Authorization: `Bearer ${res.data.access_token}`,
        },
      })

      // The response is of type SuccessDataType
    } catch (error) {
      if (error instanceof AxiosError) {
        await sendTeamsMessage('getDFSession request failed', `**Error Response**: ${error.response}<BR>`)
      }
    }
    await sleep(1000)
  }

  throw new Error('unable to get authenticated DF Session')
}
