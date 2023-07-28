import 'https://deno.land/std@0.195.0/dotenv/load.ts'
//import { Cron } from 'https://deno.land/x/croner@6.0.3/dist/croner.js'
import { checkEnvs } from './utils/handleCheckingEnvs.ts'
import { iterateDeliveryNotes } from './utils/handleIterateDeliveries.ts'

async function main() {
  //TODO: Create a function for handling env loading (Check all env fields and see if they have a value. Also if their typing is correct)
  const result = checkEnvs()

  if (result.type == 'error') {
    console.log(result.error)
  } else {
    const timestamp = new Date(new Date().getTime()).toLocaleString()
    console.log(timestamp + ': Running the pre Cron job')
    await iterateDeliveryNotes()
    /*
    const deliveryNotes = await getDeliveryNotes()
    if (!deliveryNotes) {
      console.log('No delivery notes found')
      return
    }
    const customers = await getCustomers(deliveryNotes)
    console.log(customers)
    */

    /*
    console.log(timestamp + ': Finished the initial run')

    const job = new Cron(`30 9 * * *`, async () => {
      console.log('This will run every fifth second')
      await sleep(1000)
    })
    const nextRun = job.nextRun()
    if (nextRun === null) {
      console.log('No next run')
      return
    }
    console.log('Will run first time at', nextRun.toLocaleString())
    */
  }
}

main()
