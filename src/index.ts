import 'https://deno.land/std@0.195.0/dotenv/load.ts'
import { cron } from 'https://deno.land/x/deno_cron@v1.0.0/cron.ts'
import { logoutSap } from './sap-api-wrapper/POST-logout.ts'
import { handleCheckValidatedBusinessPartners } from './utils/handleCheckValidatedBusinessPartners.ts'
import { checkEnvs } from './utils/handleCheckingEnvs.ts'
import { iterateDeliveryNotes } from './utils/handleIterateDeliveries.ts'
import { iterateStockTransfers } from './utils/handleIterateStockTransfers.ts'
import { validateBusinessPartners } from './utils/handleValidateBusinessPartners.ts'
import { validateOpenOrders } from './utils/handleValidateOpenOrders.ts'

async function main() {
  // Github repo for running deno on Pi (Seemingly only works in the terminal you run the curl script and export in, but it works
  // https://github.com/LukeChannings/deno-arm64
  // Adding the deno permanently to the $PATH variable: https://pimylifeup.com/ubuntu-add-to-path/
  const result = checkEnvs()

  if (result.type == 'error') {
    console.log(result.error)
  } else {
    console.log(new Date(new Date().getTime()).toLocaleString() + ': Running the script before starting the scheduler')

    // Initial runs
    //await validateOpenOrders()
    //await iterateDeliveryNotes()
    //await iterateStockTransfers()
    //await handleCheckValidatedBusinessPartners()
    //await validateBusinessPartners()
    //await logoutSap()

    console.log(new Date(new Date().getTime()).toLocaleString() + ': Finished the initial runs')

    // VALIDATING BUSINESS PARTNERS
    cron('0 0 17 * * 1-5', async () => {
      try {
        console.log(new Date(new Date().getTime()).toLocaleString() + ': VALIDATING BUSINESS PARTNERS')
        await handleCheckValidatedBusinessPartners()
        await validateBusinessPartners()
        console.log(new Date(new Date().getTime()).toLocaleString() + ': FINISHED VALIDATING BUSINESS PARTNERS')
        await logoutSap()
      } catch (error) {
        console.log(error)
      }
    })

    // VALIDATING OPEN ORDERS
    cron('0 */10 7-17 * * 1-5', async () => {
      try {
        await validateOpenOrders()
        await logoutSap()
      } catch (error) {
        console.log(error)
      }
    })
    // BOOKING FREIGHT AND PRINTING LABELS
    cron('*/30 */1 7-15 * * 1-5', async () => {
      try {
        await iterateDeliveryNotes()
        await iterateStockTransfers()
        await logoutSap()
      } catch (error) {
        console.log(error)
      }
    })
  }
}

await main()
