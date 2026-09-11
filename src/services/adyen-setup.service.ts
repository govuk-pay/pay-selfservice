import ConnectorClient from '@services/clients/pay/ConnectorClient.class'

const connectorClient = new ConnectorClient()

const getConnectorAdyenAccountSetup = async (serviceExternalId: string, accountType: string, credentialExternalId: string) => {
  return connectorClient.gatewayAccounts.adyenSetup.get(
    serviceExternalId,
    accountType,
    credentialExternalId
  )
}

export async function markTaskAsComplete() {
  // call client method
}

export {
  getConnectorAdyenAccountSetup
}
