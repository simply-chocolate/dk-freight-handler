import 'https://deno.land/std@0.195.0/dotenv/load.ts'
import { checkEnvs } from './utils/handleCheckingEnvs.ts'
import { iterateDeliveryNotes } from './utils/handleIterateDeliveries.ts'
import { logoutSap } from './fragt-api-wrapper/POST-logout.ts'

async function main() {
  // Github repo for running deno on Pi (Seemingly only works in the terminal you run the curl script and export in, but it works
  // https://github.com/LukeChannings/deno-arm64
  const result = checkEnvs()

  if (result.type == 'error') {
    console.log(result.error)
  } else {
    const timestamp = new Date(new Date().getTime()).toLocaleString()
    console.log(timestamp + ': Running the pre Cron job')
    await iterateDeliveryNotes()
    console.log(timestamp + ': Finished the initial run')
    await logoutSap()
  }
}

main()
