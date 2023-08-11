import 'https://deno.land/std@0.195.0/dotenv/load.ts'
import { checkEnvs } from './utils/handleCheckingEnvs.ts'
import { iterateDeliveryNotes } from './utils/handleIterateDeliveries.ts'
import { logoutSap } from './fragt-api-wrapper/POST-logout.ts'
import { cron, daily, monthly, weekly } from 'https://deno.land/x/deno_cron@v1.0.0/cron.ts'
import { iterateOpenOrders } from './utils/handleIterateOpenOrders.ts'

async function main() {
  // Github repo for running deno on Pi (Seemingly only works in the terminal you run the curl script and export in, but it works
  // https://github.com/LukeChannings/deno-arm64
  const result = checkEnvs()

  if (result.type == 'error') {
    console.log(result.error)
  } else {
    console.log(
      new Date(new Date().getTime()).toLocaleString() + ': Running the script before starting the scheduler'
    )
    await iterateOpenOrders()
    //await iterateDeliveryNotes()
    console.log(new Date(new Date().getTime()).toLocaleString() + ': Finished the initial runs')
    await logoutSap()

    // Cron jobs

    cron('0 * 8-16 * * 1-5', async () => {
      console.log(
        new Date(new Date().getTime()).toLocaleString() +
          ': Validating addresses on all open orders to DK that are confirmed and has not yet been validated'
      )
      await iterateOpenOrders()
      console.log(
        new Date(new Date().getTime()).toLocaleString() + ': Finished validating addresses on open orders '
      )
      await logoutSap()
    })

    cron('0 */10 7-16 * * 1-5', async () => {
      console.log(new Date(new Date().getTime()).toLocaleString() + ': Fetching new deliveries')
      //await iterateDeliveryNotes()
      console.log(new Date(new Date().getTime()).toLocaleString() + ': Finished fetching new deliveries')
      await logoutSap()
    })
  }
}

main()
