import 'https://deno.land/std@0.195.0/dotenv/load.ts'
import { checkEnvs } from './utils/handleCheckingEnvs.ts'
import { iterateDeliveryNotes } from './utils/handleIterateDeliveries.ts'
import { logoutSap } from './fragt-api-wrapper/POST-logout.ts'
import { cron, daily, monthly, weekly } from 'https://deno.land/x/deno_cron@v1.0.0/cron.ts'

async function main() {
  // Github repo for running deno on Pi (Seemingly only works in the terminal you run the curl script and export in, but it works
  // https://github.com/LukeChannings/deno-arm64
  const result = checkEnvs()

  if (result.type == 'error') {
    console.log(result.error)
  } else {
    console.log(new Date(new Date().getTime()).toLocaleString() + ': Running the pre Cron job')
    await iterateDeliveryNotes()
    console.log(new Date(new Date().getTime()).toLocaleString() + ': Finished the initial run')
    await logoutSap()

    cron('0 0 5 * * *', async () => {
      console.log(new Date(new Date().getTime()).toLocaleString() + ': Running the daily Cron job')
      await iterateDeliveryNotes()
      console.log(new Date(new Date().getTime()).toLocaleString() + ': Finished the daily run')
      await logoutSap()
    })
  }
}

main()
