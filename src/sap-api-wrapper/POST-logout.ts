import { AxiosError } from 'npm:axios@^1.4.0'
import { getAuthorizedClient } from '../sap-api-wrapper/POST-login.ts'

export async function logoutSap() {
  const authClient = await getAuthorizedClient( 'POST Logout' )
  if (!authClient) return
  try {
    await authClient.post('Logout')
  } catch (error) {
    if (error instanceof AxiosError) {
      // TODO: Figure out why this is failing?
      /*sendTeamsMessage(
        'logoutSap SAP request failed',
        `**Code**: ${error.code}<BR>
          **Error Message**: ${JSON.stringify(error.response?.data)}<BR>
          **Body**: ${JSON.stringify(error.config)}<BR>`
      )*/
    }
  }
}

/**
 * Code: ERR_BAD_REQUEST
Error Message: "\n\n\n\n
Bad Request
\n
Your browser sent a request that this server could not understand.
\n
\n\n"
Body: {"transitional":{"silentJSONParsing":true,"forcedJSONParsing":true,"clarifyTimeoutError":false},"adapter":["xhr","http"],"transformRequest":[null],"transformResponse":[null],"timeout":0,"xsrfCookieName":"XSRF-TOKEN","xsrfHeaderName":"X-XSRF-TOKEN","maxContentLength":-1,"maxBodyLength":-1,"env":,"headers":{"Accept":"application/json, text/plain, /","Content-Type":"application/x-www-form-urlencoded","Cookie":"B1SESSION=3f35a2f4-5dce-11ee-8000-005056a1eba7, ROUTEID=.node3","User-Agent":"axios/1.4.0","Accept-Encoding":"gzip, compress, deflate, br"},"baseURL":"https://bhsst02.bithosting.org:50000/b1s/v1","method":"post","url":"Logout"}
 * 
 * 
 */
