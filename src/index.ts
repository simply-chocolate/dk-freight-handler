import 'https://deno.land/std@0.195.0/dotenv/load.ts'
import { logoutSap } from './sap-api-wrapper/POST-logout.ts'
import { checkEnvs } from './utils/handleCheckingEnvs.ts'
import { iterateDeliveryNotes } from './utils/handleIterateDeliveries.ts'
import { validateBusinessPartners } from './utils/handleValidateBusinessPartners.ts'
import { validateOpenDeliveries } from './utils/handleValidateOpenDeliveries.ts'
import { validateOpenOrders } from './utils/handleValidateOpenOrders.ts'
import { cron } from 'https://deno.land/x/deno_cron@v1.0.0/cron.ts'
import { handleValidatedCheckBusinessPartners } from './utils/handleCheckValidatedBusinessPartners.ts'
import { printConsignmentList } from './utils/handlePrintConsignmentList.ts'

async function main() {
  // Github repo for running deno on Pi (Seemingly only works in the terminal you run the curl script and export in, but it works
  // https://github.com/LukeChannings/deno-arm64
  const result = checkEnvs()

  if (result.type == 'error') {
    console.log(result.error)
  } else {
    console.log(new Date(new Date().getTime()).toLocaleString() + ': Running the script before starting the scheduler')
    // Initial runs
    await printConsignmentList()
    /*
    await validateOpenOrders()
    await validateOpenDeliveries() // This function doesnt make sense in a produktion enviorment since we're not able to change the address in SAP.
    await iterateDeliveryNotes()
    */
    console.log(new Date(new Date().getTime()).toLocaleString() + ': Finished the initial runs')
    await logoutSap()

    // REQUIED CRON JOBS
    // Every 10 minutes between 7 and 17 on weekdays
    // TODO: Validate open orders
    // TODO: Create field "U_CCF_DF_LastValidatedAt" and set it to "new Date().getTime()" when validating an order.
    // Change the query for orders for validation to only get orders where "U_CCF_DF_LastValidatedAt" is null or where "U_CCF_DF_LastValidatedAt" is less than "UpdateTime"
    // If possible we'd like U_CCF_DF_LastValidatedAt to be a datetime. If thats not possible we'll just make it a time instead.

    // Every 10 minutes between 14 and 15
    // TODO: We should print out the consignment labels from the cached txt file.
    // TODO: Maybe we should cache a txt file from the time of printing the consignment list and
    // then check if the current donsignmentIDs list is the same or has changed.
    // If it has changed we should print the new consignment list and update the cached txt file called "printedConsignmentIds.txt".

    // Cron jobs
    // VALIDATING BUSINESS PARTNERS
    cron('0 0 14 * * 1-5', async () => {
      console.log(new Date(new Date().getTime()).toLocaleString() + ': VALIDATING OPEN ORDERS')
      await handleValidatedCheckBusinessPartners()
      await validateBusinessPartners()
      console.log(new Date(new Date().getTime()).toLocaleString() + ': FINISHED VALIDATING OPEN ORDERS')
      await logoutSap()
    })

    // VALIDATING OPEN ORDERS
    cron('0 0 7-17 * * 1-5', async () => {
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
  }
}

main()
