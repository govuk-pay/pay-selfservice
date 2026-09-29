import { Client, EnvironmentEnum, LegalEntityManagementAPI } from '@adyen/api-library'
import { LegalEntityInfoRequiredType } from '@adyen/api-library/lib/src/typings/legalEntityManagement/legalEntityInfoRequiredType'
import { LegalEntity } from '@adyen/api-library/lib/src/typings/legalEntityManagement/legalEntity'
import { AdyenMockHttpClient } from '@test/test-helpers/adyen-mock-http-client'

const ADYEN_LEGAL_ENTITY_MANAGEMENT_API_KEY = process.env.ADYEN_LEGAL_ENTITY_MANAGEMENT_API_KEY
const ADYEN_ENVIRONMENT = process.env.ADYEN_ENVIRONMENT === 'LIVE' ? EnvironmentEnum.LIVE : EnvironmentEnum.TEST

const client = process.env.MOCK_ADYEN_APIS
  // pragma: allowlist secret
  ? new Client({ apiKey: 'test', environment: ADYEN_ENVIRONMENT }, new AdyenMockHttpClient())
  : new Client({ apiKey: ADYEN_LEGAL_ENTITY_MANAGEMENT_API_KEY, environment: ADYEN_ENVIRONMENT })

const legalEntityManagementAPI = new LegalEntityManagementAPI(client)

export async function createLegalEntity(legalEntityInfo: LegalEntityInfoRequiredType): Promise<LegalEntity> {
  return legalEntityManagementAPI.LegalEntitiesApi.createLegalEntity(legalEntityInfo)
}
