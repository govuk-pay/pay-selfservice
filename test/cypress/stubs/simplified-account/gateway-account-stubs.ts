import { GatewayAccountFixture } from '@test/fixtures/gateway-account/gateway-account.fixture'
import { stubBuilder } from '@test/cypress/stubs/stub-builder'
import {
  AdyenAccountSetupData,
  AdyenAccountSetupTaskData,
  AdyenAccountSetupTaskNameData,
} from '@models/gateway-account/dto/AdyenAccountSetup.dto'

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

export function getAdyenSetpTasks(
  serviceExternalId: string,
  accountType: string,
  credentialExternalId: string,
  tasksWithStatus: Record<AdyenAccountSetupTaskNameData, AdyenAccountSetupTaskData>
) {
  const path = `/v1/api/service/${serviceExternalId}/account/${accountType}/adyen-setup/${credentialExternalId}`
  const data: AdyenAccountSetupData = {
    service_id: serviceExternalId,
    credential_external_id: credentialExternalId,
    tasks: tasksWithStatus,
  }

  return {
    success: function () {
      return stubBuilder('GET', path, 200, {
        response: data,
      })
    },
  }
}
