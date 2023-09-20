import axios, { AxiosError, AxiosInstance } from 'axios'
import { sleep } from '../utils/sleep.ts'
import { sendTeamsMessage } from '../teams_notifier/SEND-teamsMessage.ts'

type SuccessDataType = {
  status: number
  statusText: string
  headers: {
    'set-cookie': string[]
  }
  data: {
    'odata.metadata': string
    SessionId: string
    Version: string
    SessionTimeOut: number
  }
}

export type ErrorDataType = {
  response: {
    data: {
      error: {
        message: {
          value: string
        }
      }
    }
  }
}

export async function getAuthorizedClient(): Promise<AxiosInstance> {
  for (let retryCount = 0; retryCount < 3; retryCount++) {
    try {
      const res = await axios<SuccessDataType | ErrorDataType>({
        method: 'post',
        baseURL: Deno.env.get('SAP_URL'),
        url: 'Login',
        data: {
          CompanyDB: Deno.env.get('SAP_COMPANY'),
          UserName: Deno.env.get('SAP_USERNAME'),
          Password: Deno.env.get('SAP_PASSWORD'),
        },
      })

      return axios.create({
        baseURL: Deno.env.get('SAP_URL'),
        headers: {
          Cookie: res.headers['set-cookie']?.map((e) => e.split(';')[0]),
        },
      })
    } catch (error) {
      if (error instanceof AxiosError) {
        await sendTeamsMessage(
          'getAuthorizedClient SAP request failed',
          `**Code**: ${error.response?.data.error.code}<BR>
            **Error Message**: ${error.response?.data.error.message.value}<BR>`
        )
      }
    }

    await sleep(1000)
  }

  throw new Error('unable to get authenticated SAP client')
}
