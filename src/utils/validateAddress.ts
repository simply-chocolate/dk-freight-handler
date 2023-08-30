import axios, { AxiosError } from 'npm:axios@1.4.0'
import { AddressExtension } from '../sap-api-wrapper/GET-DeliveryNotes.ts'
import { sendTeamsMessage } from '../teams_notifier/SEND-teamsMessage.ts'

export type ValidatedAddressResult = ValidatedAddress[]

export type ValidatedAddress = {
  adressebetegnelse: string
  adgangsadresse: {
    adressebetegnelse: string
    vejstykke: {
      adresseringsnavn: string
    }
    husnr: string
    postnummer: {
      nr: string
      navn: string
    }
  }
}

export async function getAddressValidation(addressExtension: AddressExtension): Promise<ValidatedAddressResult | void> {
  try {
    const res = await axios.get<ValidatedAddressResult>(
      `https://api.dataforsyningen.dk/adresser/?q=${addressExtension.ShipToStreet}, ${addressExtension.ShipToZipCode} ${addressExtension.ShipToCity}`
    )

    return res.data
  } catch (error) {
    if (error instanceof AxiosError) {
      sendTeamsMessage(
        'getAddressValidation request failed',
        `**Code**: ${error.code}<BR>
          **Error Message**: ${JSON.stringify(error.response?.data)}<BR>
          **Body**: ${JSON.stringify(error.config)}<BR>`
      )
    }
  }
}

export async function validateAddress(addressExtension: AddressExtension, cardCode: string, orderNumber: number): Promise<string | void> {
  if (addressExtension.ShipToStreet != null) {
    addressExtension.ShipToStreet = addressExtension.ShipToStreet.toLowerCase()
  }
  if (addressExtension.ShipToCity != null) {
    addressExtension.ShipToCity = addressExtension.ShipToCity.toLowerCase()
  }
  if (addressExtension.ShipToZipCode != null) {
    addressExtension.ShipToZipCode = addressExtension.ShipToZipCode.toLowerCase()
  }

  const validatedAddress = await getAddressValidation(addressExtension)

  if (!validatedAddress) {
    sendTeamsMessage(
      'Address validation failed',
      `**Customer Number**: ${cardCode} <BR>
      **OrderNumber**: ${orderNumber} <BR>
      **Error**: No address found in DAWA <BR>
      **Address SAP**: ${addressExtension.ShipToStreet}, ${addressExtension.ShipToZipCode} ${addressExtension.ShipToCity} <BR>
      `
    )
    return 'Address validation failed: No address found in DAWA'
  } else if (validatedAddress.length === 0) {
    sendTeamsMessage(
      'Address validation failed',
      `**Customer Number**: ${cardCode} <BR>
      **OrderNumber**: ${orderNumber} <BR>
      **Error**: No address found in DAWA <BR>
      **Address SAP**: ${addressExtension.ShipToStreet}, ${addressExtension.ShipToZipCode} ${addressExtension.ShipToCity} <BR>
      `
    )
    return 'Address validation failed: No address found in DAWA'
  }

  let addressMatchFound = false
  const wrongAddresses: string[] = []

  for (const address of validatedAddress) {
    address.adressebetegnelse = address.adressebetegnelse.toLowerCase()

    if (`${addressExtension.ShipToStreet}, ${addressExtension.ShipToZipCode} ${addressExtension.ShipToCity}` !== address.adressebetegnelse) {
      wrongAddresses.push(address.adressebetegnelse)
      continue
    } else {
      addressMatchFound = true
      break
    }
  }
  if (!addressMatchFound) {
    sendTeamsMessage(
      'Address validation failed',
      `**Customer Number**: ${cardCode} <BR>
    **OrderNumber**: ${orderNumber} <BR>
    **Error**: Adress don't match<BR>
    **Address SAP**: ${addressExtension.ShipToStreet}, ${addressExtension.ShipToZipCode} ${addressExtension.ShipToCity} <BR>
    **Address DAWA**: ${wrongAddresses} <BR>
    `
    )
    return 'None of the addresses found in DAWA matched' + wrongAddresses
  }

  return
}
