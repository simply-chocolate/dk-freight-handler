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
    const streetNr = addressExtension.ShipToStreet
      ? addressExtension.ShipToStreet
      : addressExtension.ShipToBlock

    const res = await axios.get<ValidatedAddressResult>(
      `https://api.dataforsyningen.dk/adresser/?q=${addressExtension.ShipToStreet}${streetNr}${addressExtension.ShipToZipCode}${addressExtension.ShipToCity}`
    )

    return res.data
  } catch (error) {
    if (error instanceof AxiosError) {
      console.log(error)
    }
  }
}

export async function validateAddress(
  addressExtension: AddressExtension,
  cardCode: string,
  orderNumber: number
): Promise<string[] | void> {
  const validatedAddress = await getAddressValidation(addressExtension)

  if (!validatedAddress) {
    return ['Address validation failed: No address found in DAWA']
  } else if (validatedAddress.length === 0) {
    return ['Address validation failed: No address found in DAWA']
  }
  for (const address of validatedAddress) {
    const errors: string[] = []
    address.adgangsadresse.husnr == addressExtension.ShipToBlock || addressExtension.ShipToStreet
      ? ''
      : errors.push(
          'street number does not match. ValidatedAddress Value: ',
          address.adgangsadresse.husnr,
          ' ShipToBlock Value: ',
          addressExtension.ShipToBlock,
          ' ShipToStreet Value: ',
          addressExtension.ShipToStreet
        )

    address.adgangsadresse.postnummer.nr == addressExtension.ShipToZipCode
      ? ''
      : errors.push(
          'zip code does not match. ValidatedAddress Value: ',
          address.adgangsadresse.postnummer.nr,
          ' ShipToZipCode Value: ',
          addressExtension.ShipToZipCode
        )

    address.adgangsadresse.postnummer.navn == addressExtension.ShipToCity
      ? ''
      : errors.push(
          'city does not match ValidatedAddress Value: ',
          address.adgangsadresse.postnummer.navn,
          ' ShipToCity Value: ',
          addressExtension.ShipToCity
        )

    address.adgangsadresse.vejstykke.adresseringsnavn == addressExtension.ShipToStreet
      ? ''
      : errors.push(
          'street name does not match. ValidatedAddress Value: ',
          address.adgangsadresse.vejstykke.adresseringsnavn,
          ' ShipToStreet Value: ',
          addressExtension.ShipToStreet
        )

    if (errors.length > 0) {
      sendTeamsMessage(
        'Address validation failed',
        `**Customer Number**: ${cardCode} <BR>
        **Delivery Note**: ${orderNumber} <BR>
        **Errors**: ${errors.join(' ')}`
      )
      return errors
    }
  }

  return
}
