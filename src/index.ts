import 'https://deno.land/std@0.195.0/dotenv/load.ts'
//import { Cron } from 'https://deno.land/x/croner@6.0.3/dist/croner.js'
import { checkEnvs } from './utils/handleCheckingEnvs.ts'
import { iterateDeliveryNotes } from './utils/handleIterateDeliveries.ts'

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
    const nextRun = job.nextRun()https://notifications.google.com/g/p/ADa0GC8lpucvBTipF2QYdnIQPJyYJwVZQSJ_mvtRyc86ayfD4y6qVmLyLn5wdC_s-0XcdRsbHICt4uveXT2GfF-xIZdkw8_sRvBgqxhUxM5CXLQOO9gxy45BHZaEnVwJq8QWZt-1j9G531zNkIn7UEnX6KtVsD10EJAuS5Qf9YF_txgP0jFSYs4D_YLJySRLS5JYR2JsBlsMqkjWMRd1qzGOq3SzIqzlgiPJG0eBl8iyXwOwSp4G1vy5r6JMPyD0pfFrW_LNOM0Es7ZuiJ6vQgGchiBsK6aEoib8DOak9GVN3epdViuvwIA9OxlWm0pNWau5ynwWhknk2ib2xvQe93Pr_Q6b9DiKcVauOPDIaRnRn5oGhLi4UgF1_iAkMzidcyemT_hgEU0tNWpVTKLZXsQzWsP9lidJ9XxHKoXhLfbmOokKvA4mQDetOBvB8G7eKKIJh-7TKcx9LhxRU51AHhvsi1xnRLz5dP0
    if (nextRun === null) {
      console.log('No next run')
      return
    }
    console.log('Will run first time at', nextRun.toLocaleString())
    */
  }
}

main()
