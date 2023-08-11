import axios, { AxiosError } from 'npm:axios@1.4.0'
import { AddressExtension } from '../sap-api-wrapper/GET-DeliveryNotes.ts'
import { sendTeamsMessage } from '../teams_notifier/SEND-teamsMessage.ts'

export type ValidatedAddressResult = ValidatedAddress[]

export type ValidatedAddress = {
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

export async function getAddressValidation(
  addressExtension: AddressExtension
): Promise<ValidatedAddressResult | void> {
  try {
    const res = await axios.get<ValidatedAddressResult>(
      `https://api.dataforsyningen.dk/adresser/?q=${addressExtension.ShipToStreet} ${addressExtension.ShipToZipCode} ${addressExtension.ShipToCity}`
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

export async function validateAddress(
  addressExtension: AddressExtension,
  cardCode: string,
  orderNumber: number
): Promise<string | void> {
  if (addressExtension.ShipToStreet != null) {
    addressExtension.ShipToStreet = addressExtension.ShipToStreet.toLowerCase()
  }
  if (addressExtension.ShipToCity != null) {
    addressExtension.ShipToCity = addressExtension.ShipToCity.toLowerCase()
  }

  const validatedAddress = await getAddressValidation(addressExtension)

  if (!validatedAddress) {
    sendTeamsMessage(
      'Address validation failed',
      `**Customer Number**: ${cardCode} <BR>
      **OrderNumber**: ${orderNumber} <BR>
      **Error**: No address found in DAWA <BR>
      **ShipToStreet/Address**: ${addressExtension.ShipToStreet} <BR>
      **ShipToBlock/Port no.**: ${addressExtension.ShipToBlock} <BR>
      **ShipToZipCode**: ${addressExtension.ShipToZipCode} <BR>
      **ShipToCity**: ${addressExtension.ShipToCity} <BR>
      `
    )
    return 'Address validation failed: No address found in DAWA'
  } else if (validatedAddress.length === 0) {
    sendTeamsMessage(
      'Address validation failed',
      `**Customer Number**: ${cardCode} <BR>
      **OrderNumber**: ${orderNumber} <BR>
      **Error**: No address found in DAWA <BR>
      **ShipToStreet/Address**: ${addressExtension.ShipToStreet} <BR>
      **ShipToBlock/Port no.**: ${addressExtension.ShipToBlock} <BR>
      **ShipToZipCode**: ${addressExtension.ShipToZipCode} <BR>
      **ShipToCity**: ${addressExtension.ShipToCity} <BR>
      `
    )
    return 'Address validation failed: No address found in DAWA'
  }
  for (const address of validatedAddress) {
    address.adgangsadresse.vejstykke.adresseringsnavn =
      address.adgangsadresse.vejstykke.adresseringsnavn.toLowerCase()
    address.adgangsadresse.postnummer.navn = address.adgangsadresse.postnummer.navn.toLowerCase()

    const errors: string[] = []

    if (
      addressExtension.ShipToStreet !==
      `${address.adgangsadresse.vejstykke.adresseringsnavn} ${address.adgangsadresse.husnr}`
    ) {
      errors.push('<BR>Street name')
    }

    if (address.adgangsadresse.postnummer.nr !== addressExtension.ShipToZipCode) {
      errors.push('<BR>Zip code')
    }

    if (address.adgangsadresse.postnummer.navn !== addressExtension.ShipToCity) {
      errors.push('<BR>City')
    }

    if (errors.length > 0) {
      sendTeamsMessage(
        'Address validation failed',
        `**Customer Number**: ${cardCode} <BR>
        **Order**: ${orderNumber} <BR>
        **Errors**: ${errors.join(' ')}`
      )
      return errors.join(',').replaceAll('<BR>', '')
    }
  }

  return
}
