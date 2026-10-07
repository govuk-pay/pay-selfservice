import { GatewayAccountCredentialUpdateRequest } from '@models/gateway-account-credential/GatewayAccountCredentialUpdateRequest.class'
import ConnectorClient from '@services/clients/pay/ConnectorClient.class'
import { createLegalEntity } from '@services/clients/adyen/adyen-legal-entity-management.client'
import { OrganisationDetailsSession } from '@controllers/simplified-account/settings/adyen-details/organisation-details/constants'
import { Types } from '@adyen/api-library'

type LegalEntityInfoRequiredType = Types.legalEntityManagement.LegalEntityInfoRequiredType
type Organization = Types.legalEntityManagement.Organization

const connectorClient = new ConnectorClient()

const setAdyenLegalEntityId = async (
  serviceExternalId: string,
  accountType: string,
  credentialExternalId: string,
  userExternalId: string,
  legalEntityId: string
) => {
  return connectorClient.gatewayAccounts.patchCredentialsByServiceExternalIdAndAccountType(
    serviceExternalId,
    accountType,
    credentialExternalId,
    new GatewayAccountCredentialUpdateRequest(userExternalId).replace().credentials().legalEntityId(legalEntityId)
  )
}

const setAdyenStoreId = async (
  serviceExternalId: string,
  accountType: string,
  credentialExternalId: string,
  userExternalId: string,
  storeId: string
) => {
  return connectorClient.gatewayAccounts.patchCredentialsByServiceExternalIdAndAccountType(
    serviceExternalId,
    accountType,
    credentialExternalId,
    new GatewayAccountCredentialUpdateRequest(userExternalId).replace().credentials().storeId(storeId)
  )
}

const setAdyenAccountHolderId = async (
  serviceExternalId: string,
  accountType: string,
  credentialExternalId: string,
  userExternalId: string,
  accountHolderId: string
) => {
  return connectorClient.gatewayAccounts.patchCredentialsByServiceExternalIdAndAccountType(
    serviceExternalId,
    accountType,
    credentialExternalId,
    new GatewayAccountCredentialUpdateRequest(userExternalId).replace().credentials().accountHolderId(accountHolderId)
  )
}

const setAdyenBalanceAccountId = async (
  serviceExternalId: string,
  accountType: string,
  credentialExternalId: string,
  userExternalId: string,
  balanceAccountId: string
) => {
  return connectorClient.gatewayAccounts.patchCredentialsByServiceExternalIdAndAccountType(
    serviceExternalId,
    accountType,
    credentialExternalId,
    new GatewayAccountCredentialUpdateRequest(userExternalId).replace().credentials().balanceAccountId(balanceAccountId)
  )
}

const createOrganisation = async (session: OrganisationDetailsSession) => {
  const organization: Organization = {
    legalName: session.organisationName ?? '',
    registeredAddress: {
      street: session.addressLine1,
      street2: session.addressLine2,
      city: session.addressCity,
      postalCode: session.addressPostcode,
      country: session.addressCountry ?? '',
    },
    registrationNumber: session.companyRegistrationNumber,
    vatNumber: session.vatRegistrationNumber,
  }

  const legalEntityInfo: LegalEntityInfoRequiredType = {
    type: Types.legalEntityManagement.LegalEntityInfoRequiredType.TypeEnum.Organization,
    organization,
  }

  return createLegalEntity(legalEntityInfo)
}

export { setAdyenLegalEntityId, setAdyenStoreId, setAdyenAccountHolderId, setAdyenBalanceAccountId, createOrganisation }
