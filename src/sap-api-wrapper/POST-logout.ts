import { getAuthorizedClient } from '../sap-api-wrapper/POST-login.ts'

export async function logoutSap() {
  const authClient = await getAuthorizedClient()
  if (!authClient) return
  authClient.post('Logout')
}
