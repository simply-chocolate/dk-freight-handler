import 'https://deno.land/std@0.195.0/dotenv/load.ts'
import { logoutSap } from './sap-api-wrapper/POST-logout.ts'
import { checkEnvs } from './utils/handleCheckingEnvs.ts'
import { validateOpenOrders } from './utils/handleValidateOpenOrders.ts'
import { sendTeamsMessage } from "./teams_notifier/SEND-teamsMessage.ts";

async function mainVO() {
  // Github repo for running deno on Pi (Seemingly only works in the terminal you run the curl script and export in, but it works
  // https://github.com/LukeChannings/deno-arm64
  // Adding the deno permanently to the $PATH variable: https://pimylifeup.com/ubuntu-add-to-path/
  const result = checkEnvs()

  if (result.type == 'error') {
    console.log(result.error)
  } else {
    try {
      await validateOpenOrders()
      //await logoutSap()
    } catch (error) {
      await sendTeamsMessage('Error in mainVO', String(error),'summary')
    }        
  }
}

await mainVO()
