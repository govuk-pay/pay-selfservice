import ConnectorClient from '@services/clients/pay/ConnectorClient.class'
import { AdyenAccountSetupUpdateRequest } from '@models/gateway-account/AdyenAccountSetupUpdateRequest.class'
import { AdyenAccountSetupTaskName, AdyenAccountSetupTaskStatus } from '@models/gateway-account/AdyenAccountSetup.class'

const connectorClient = new ConnectorClient()

const getConnectorAdyenAccountSetup = async (
  serviceExternalId: string,
  accountType: string,
  credentialExternalId: string
) => {
  return connectorClient.gatewayAccounts.adyenSetup.get(serviceExternalId, accountType, credentialExternalId)
}

export const markTaskAsComplete = async (
  serviceExternalId: string,
  accountType: string,
  credentialExternalId: string,
  task: AdyenAccountSetupTaskName
) => {
  const updateRequest = new AdyenAccountSetupUpdateRequest().replace()[task](AdyenAccountSetupTaskStatus.COMPLETED)

  await connectorClient.gatewayAccounts.adyenSetup.patch(
    serviceExternalId,
    accountType,
    credentialExternalId,
    updateRequest
  )
}

export { getConnectorAdyenAccountSetup }
