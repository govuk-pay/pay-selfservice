import { GatewayAccountFixture } from '@test/fixtures/gateway-account/gateway-account.fixture'
import { stubBuilder } from '@test/cypress/stubs/stub-builder'
import { AdyenAccountSetupTaskStatus } from '@models/gateway-account/AdyenAccountSetup.class'

export function searchByServiceExternalIds(serviceExternalIds: string[]) {
  const path = `/v1/api/accounts`

  return {
    success: function (gatewayAccounts: GatewayAccountFixture[]) {
      return stubBuilder('GET', path, 200, {
        query: {
          serviceIds: serviceExternalIds,
        },
        response: {
          accounts: gatewayAccounts.map((account) => account.toGatewayAccountData()),
        },
      })
    },
  }
}

export function getByServiceExternalIdAndAccountType(serviceExternalId: string, accountType: string) {
  const path = `/v1/api/service/${serviceExternalId}/account/${accountType}`

  return {
    success: function (gatewayAccount: GatewayAccountFixture) {
      return stubBuilder('GET', path, 200, {
        response: gatewayAccount.toGatewayAccountData(),
      })
    },
  }
}

export function patchAdyenAccountTask(serviceExternalId: string, accountType: string, credentialExternalId: string, taskType: string) {
  const path = `/v1/api/service/${serviceExternalId}/account/${accountType}/adyen-setup/${credentialExternalId}`

  return {
    success: function () {
      return stubBuilder('PATCH', path, 200, {
        request: {
          op: 'replace',
          path: taskType,
          value: AdyenAccountSetupTaskStatus.COMPLETED,
        },
      })
    },
  }
}
