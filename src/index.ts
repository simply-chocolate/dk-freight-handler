import 'https://deno.land/std@0.195.0/dotenv/load.ts'
import { cron } from 'https://deno.land/x/deno_cron@v1.0.0/cron.ts'
import { logoutSap } from './sap-api-wrapper/POST-logout.ts'
import { handleCheckValidatedBusinessPartners } from './utils/handleCheckValidatedBusinessPartners.ts'
import { checkEnvs } from './utils/handleCheckingEnvs.ts'
import { emptyConsignmentLists } from './utils/handleConsignmentsListFiles.ts'
import { iterateDeliveryNotes } from './utils/handleIterateDeliveries.ts'
import { printConsignmentList } from './utils/handlePrintConsignmentList.ts'
import { validateBusinessPartners } from './utils/handleValidateBusinessPartners.ts'
import { validateOpenDeliveries } from './utils/handleValidateOpenDeliveries.ts'
import { validateOpenOrders } from './utils/handleValidateOpenOrders.ts'
import { returnDateWithHours } from './utils/utils.ts'

async function main() {
  // Github repo for running deno on Pi (Seemingly only works in the terminal you run the curl script and export in, but it works
  // https://github.com/LukeChannings/deno-arm64

  const result = checkEnvs()

  if (result.type == 'error') {
    console.log(result.error)
  } else {
    console.log(new Date(new Date().getTime()).toLocaleString() + ': Running the script before starting the scheduler')
    // Initial runs

    // TODO: Sæt "Test" på fragt labels mens vi teste
    // TODO: Ref felt skal indeholde Vores Ordrenummer, Deres PO og en evt. Att: Person (Tages fra Ekstern Kommentar)

    //await validateOpenOrders()
    //await validateOpenDeliveries() // TODO: DELETE THIS FUNCTION AND ALL TRACES.
    //await iterateDeliveryNotes()
    //await handleCheckValidatedBusinessPartners()
    //await validateBusinessPartners()
    //await logoutSap()

    console.log(new Date(new Date().getTime()).toLocaleString() + ': Finished the initial runs')

    // VALIDATING BUSINESS PARTNERS
    cron('0 0 4 * * 1-5', async () => {
      console.log(new Date(new Date().getTime()).toLocaleString() + ': VALIDATING OPEN ORDERS')
      await handleCheckValidatedBusinessPartners()
      await validateBusinessPartners()
      console.log(new Date(new Date().getTime()).toLocaleString() + ': FINISHED VALIDATING OPEN ORDERS')
      await logoutSap()
    })

    // VALIDATING OPEN ORDERS
    cron('0 */10 7-17 * * 1-5', async () => {
      console.log(new Date(new Date().getTime()).toLocaleString() + ': VALIDATING OPEN ORDERS')
      await validateOpenOrders()
      console.log(new Date(new Date().getTime()).toLocaleString() + ': FINISHED VALIDATING OPEN ORDERS')
      await logoutSap()
    })
    // BOOKING FREIGHT AND PRINTING LABELS
    cron('0 */5 7-15 * * 1-5', async () => {
      console.log(new Date(new Date().getTime()).toLocaleString() + ': BOOKING FREIGHT AND PRINTING LABELS')
      await iterateDeliveryNotes()
      console.log(new Date(new Date().getTime()).toLocaleString() + ': FINISHED BOOKING FREIGHT AND PRINTING LABELS')
      await logoutSap()
    })

    // PRINTING CONSIGNMENT LIST
    cron('0 */10 14 * * 1-5', async () => {
      console.log(new Date(new Date().getTime()).toLocaleString() + ': PRINTING CONSIGNMENT LIST')
      await printConsignmentList()
      console.log(new Date(new Date().getTime()).toLocaleString() + ': FINISHED PRINTING CONSIGNMENT LIST')
    })

    // EMPTYING THE CONSIGNMENT LIST TXT TILES
    cron('0 0 20 * * 1-5', async () => {
      console.log(new Date(new Date().getTime()).toLocaleString() + ': EMPTYING THE CONSIGNMENT LIST TXT TILES')
      await emptyConsignmentLists()
      console.log(new Date(new Date().getTime()).toLocaleString() + ': FINISHED EMPTYING THE CONSIGNMENT LIST TXT TILES')
    })
  }
}

main()
