import axios, { AxiosError } from 'npm:axios@1.4.0'
import { AddressExtension } from '../sap-api-wrapper/GET-DeliveryNotes.ts'
import { sendTeamsMessage } from '../teams_notifier/SEND-teamsMessage.ts'
import { SapBusinessPartnerAddress } from '../sap-api-wrapper/GET-BusinessPartners.ts'
import { sendAddressValidationToTeams } from '../teams_notifier/SEND-addressValidation.ts'
import { correctCasing } from './utils.ts'

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
    addressExtension.ShipToStreet = correctCasing(addressExtension.ShipToStreet)
  }
  if (addressExtension.ShipToCity != null) {
    addressExtension.ShipToCity = correctCasing(addressExtension.ShipToCity)
  }
  if (addressExtension.ShipToZipCode != null) {
    addressExtension.ShipToZipCode = correctCasing(addressExtension.ShipToZipCode)
  }

  const validatedAddress = await getAddressValidation(addressExtension)

  if (!validatedAddress) {
    return 'Address validation failed: No address found in DAWA'
    await sendAddressValidationToTeams(
      'Document Address validation failed',
      `**Customer Number**: ${cardCode} <BR>
      **OrderNumber**: ${orderNumber} <BR>
      **Error**: No address found in DAWA <BR>
      **Address SAP**: ${addressExtension.ShipToStreet}, ${addressExtension.ShipToZipCode} ${addressExtension.ShipToCity} <BR>`
    )
  } else if (validatedAddress.length === 0) {
    return 'Address not found in DAWA: ' + addressExtension.ShipToStreet + ', ' + addressExtension.ShipToZipCode + ' ' + addressExtension.ShipToCity
    await sendAddressValidationToTeams(
      'Document Address validation failed',
      `**Customer Number**: ${cardCode} <BR>
      **OrderNumber**: ${orderNumber} <BR>
      **Error**: No address found in DAWA <BR>
      **Address SAP**: ${addressExtension.ShipToStreet}, ${addressExtension.ShipToZipCode} ${addressExtension.ShipToCity} <BR>`
    )
  }

  let addressMatchFound = false
  const wrongAddresses: string[] = []

  for (const address of validatedAddress) {
    address.adressebetegnelse = correctCasing(address.adressebetegnelse)

    if (`${addressExtension.ShipToStreet}, ${addressExtension.ShipToZipCode} ${addressExtension.ShipToCity}` !== address.adressebetegnelse) {
      wrongAddresses.push(address.adressebetegnelse)
      continue
    } else {
      addressMatchFound = true
      break
    }
  }
  if (!addressMatchFound) {
    return 'None of the addresses found in DAWA matched: ' + wrongAddresses
    await sendAddressValidationToTeams(
      'Document Address validation failed',
      `**Customer Number**: ${cardCode} <BR>
      **OrderNumber**: ${orderNumber} <BR>
      **Error**: Adress don't match<BR>
      **Address SAP**: ${addressExtension.ShipToStreet}, ${addressExtension.ShipToZipCode} ${addressExtension.ShipToCity} <BR>
      **Address DAWA**: ${wrongAddresses.join('<BR>')}`
    )
  }

  return 'validated'
}

export async function validateBPAddress(address: SapBusinessPartnerAddress, cardCode: string): Promise<string> {
  if (address.Street != null) {
    address.Street = correctCasing(address.Street)
  }
  if (address.City != null) {
    address.City = correctCasing(address.City)
  }
  if (address.ZipCode != null) {
    address.ZipCode = correctCasing(address.ZipCode)
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
    return 'Address not found in DAWA: ' + addressExtension.ShipToStreet + ', ' + addressExtension.ShipToZipCode + ' ' + addressExtension.ShipToCity
    await sendAddressValidationToTeams(
      'Business Partner Address validation failed',
      `**Customer Number**: ${cardCode} <BR>
      **AddressName**: ${addressExtension.ShipToBuilding} <BR>
      **Error**: No address found in DAWA <BR>
      **Address SAP**: ${addressExtension.ShipToStreet}, ${addressExtension.ShipToZipCode} ${addressExtension.ShipToCity} <BR>`
    )
  } else if (validatedAddress.length === 0) {
    return 'Address not found in DAWA: ' + addressExtension.ShipToStreet + ', ' + addressExtension.ShipToZipCode + ' ' + addressExtension.ShipToCity
    await sendAddressValidationToTeams(
      'Business Partner Address validation failed',
      `**Customer Number**: ${cardCode} <BR>
      **AddressName**: ${addressExtension.ShipToBuilding} <BR>
      **Error**: No address found in DAWA <BR>
      **Address SAP**: ${addressExtension.ShipToStreet}, ${addressExtension.ShipToZipCode} ${addressExtension.ShipToCity} <BR>`
    )
  }

  let addressMatchFound = false
  const wrongAddresses: string[] = []

  for (const address of validatedAddress) {
    address.adressebetegnelse = correctCasing(address.adressebetegnelse)

    if (`${addressExtension.ShipToStreet}, ${addressExtension.ShipToZipCode} ${addressExtension.ShipToCity}` !== address.adressebetegnelse) {
      wrongAddresses.push(address.adressebetegnelse)
      continue
    } else {
      addressMatchFound = true
      break
    }
  }
  if (!addressMatchFound) {
    return 'None of the addresses found in DAWA matched ' + wrongAddresses
    await sendAddressValidationToTeams(
      'Business Partner Address validation failed',
      `**Customer Number**: ${cardCode} <BR>
      **AddressName**: ${addressExtension.ShipToBuilding} <BR>
      **Error**: Addresses doesn't match <BR>
      **Address SAP**: ${addressExtension.ShipToStreet}, ${addressExtension.ShipToZipCode} ${addressExtension.ShipToCity} <BR>
      **Address DAWA**: ${wrongAddresses.join('<BR>')}`
    )
  }

  return 'validated'
}
