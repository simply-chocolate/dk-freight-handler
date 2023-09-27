import axios, { AxiosError } from 'npm:axios@1.4.0'
import { AddressExtension } from '../sap-api-wrapper/GET-DeliveryNotes.ts'
import { sendTeamsMessage } from '../teams_notifier/SEND-teamsMessage.ts'
import { SapBusinessPartnerAddress } from '../sap-api-wrapper/GET-BusinessPartners.ts'
import { sendAddressValidationToTeams } from '../teams_notifier/SEND-addressValidation.ts'

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
      await sendTeamsMessage(
        'getAddressValidation request failed',
        `**Code**: ${error.code}<BR>
        **Error Message**: ${JSON.stringify(error.response?.data)}<BR>
        **Body**: ${JSON.stringify(error.config)}<BR>`
      )
    }
  }
}

export async function validateDocumentAddress(addressExtension: AddressExtension, cardCode: string, orderNumber: number): Promise<string> {
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
    await sendAddressValidationToTeams(
      'Document Address validation failed',
      `**Customer Number**: ${cardCode} <BR>
      **OrderNumber**: ${orderNumber} <BR>
      **Error**: No address found in DAWA <BR>
      **Address SAP**: ${addressExtension.ShipToStreet}, ${addressExtension.ShipToZipCode} ${addressExtension.ShipToCity} <BR>`
    )
    return 'Address validation failed: No address found in DAWA'
  } else if (validatedAddress.length === 0) {
    await sendAddressValidationToTeams(
      'Document Address validation failed',
      `**Customer Number**: ${cardCode} <BR>
      **OrderNumber**: ${orderNumber} <BR>
      **Error**: No address found in DAWA <BR>
      **Address SAP**: ${addressExtension.ShipToStreet}, ${addressExtension.ShipToZipCode} ${addressExtension.ShipToCity} <BR>`
    )
    return 'Address not found in DAWA: ' + addressExtension.ShipToStreet + ', ' + addressExtension.ShipToZipCode + ' ' + addressExtension.ShipToCity
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
    await sendAddressValidationToTeams(
      'Document Address validation failed',
      `**Customer Number**: ${cardCode} <BR>
      **OrderNumber**: ${orderNumber} <BR>
      **Error**: Adress don't match<BR>
      **Address SAP**: ${addressExtension.ShipToStreet}, ${addressExtension.ShipToZipCode} ${addressExtension.ShipToCity} <BR>
      **Address DAWA**: ${wrongAddresses.join('<BR>')}`
    )
    return 'None of the addresses found in DAWA matched: ' + wrongAddresses
  }

  return 'validated'
}

export async function validateBPAddress(address: SapBusinessPartnerAddress, cardCode: string): Promise<string> {
  if (address.Street != null) {
    address.Street = address.Street.toLowerCase()
  }
  if (address.City != null) {
    address.City = address.City.toLowerCase()
  }
  if (address.ZipCode != null) {
    address.ZipCode = address.ZipCode.toLowerCase()
  }

  const addressExtension: AddressExtension = {
    ShipToStreet: address.Street,
    ShipToCity: address.City,
    ShipToZipCode: address.ZipCode,
    ShipToBlock: address.Block,
    ShipToBuilding: address.AddressName,
    ShipToCountry: address.Country,
  }

  const validatedAddress = await getAddressValidation(addressExtension)

  if (!validatedAddress) {
    await sendAddressValidationToTeams(
      'Business Partner Address validation failed',
      `**Customer Number**: ${cardCode} <BR>
      **AddressName**: ${address.AddressName} <BR>
      **Error**: No address found in DAWA <BR>
      **Address SAP**: ${address.Street}, ${address.ZipCode} ${address.City} <BR>`
    )
    return 'Address not found in DAWA: ' + addressExtension.ShipToStreet + ', ' + addressExtension.ShipToZipCode + ' ' + addressExtension.ShipToCity
  } else if (validatedAddress.length === 0) {
    await sendAddressValidationToTeams(
      'Address validation failed',
      `**Customer Number**: ${cardCode} <BR>
      **AddressName**: ${address.AddressName} <BR>
      **Error**: No address found in DAWA <BR>
      **Address SAP**: ${address.Street}, ${address.ZipCode} ${address.City} <BR>`
    )
    return 'Address not found in DAWA: ' + addressExtension.ShipToStreet + ', ' + addressExtension.ShipToZipCode + ' ' + addressExtension.ShipToCity
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
    await sendAddressValidationToTeams(
      'Address validation failed',
      `**Customer Number**: ${cardCode} <BR>
      **AddressName**: ${address.AddressName} <BR>
      **Error**: Addresses doesn't match <BR>
      **Address SAP**: ${addressExtension.ShipToStreet}, ${addressExtension.ShipToZipCode} ${addressExtension.ShipToCity} <BR>
      **Address DAWA**: ${wrongAddresses.join('<BR>')}`
    )
    return 'None of the addresses found in DAWA matched ' + wrongAddresses
  }

  return 'validated'
}
