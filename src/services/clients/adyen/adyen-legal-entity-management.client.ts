import { Client, EnvironmentEnum, LegalEntityManagementAPI } from '@adyen/api-library'
import { LegalEntityInfoRequiredType } from '@adyen/api-library/lib/src/typings/legalEntityManagement/legalEntityInfoRequiredType'
import { LegalEntity } from '@adyen/api-library/lib/src/typings/legalEntityManagement/legalEntity'
import { AdyenMockServerHttpClient } from '@services/clients/adyen/adyen-mock-server-http-client'

const ADYEN_LEGAL_ENTITY_MANAGEMENT_API_KEY = process.env.ADYEN_LEGAL_ENTITY_MANAGEMENT_API_KEY
const ADYEN_ENVIRONMENT = process.env.ADYEN_ENVIRONMENT === 'LIVE' ? EnvironmentEnum.LIVE : EnvironmentEnum.TEST
const ADYEN_MOCK_SERVER_URL = process.env.ADYEN_MOCK_SERVER_URL

const client = new Client(
  { apiKey: ADYEN_LEGAL_ENTITY_MANAGEMENT_API_KEY, environment: ADYEN_ENVIRONMENT },
  ADYEN_MOCK_SERVER_URL ? new AdyenMockServerHttpClient(ADYEN_MOCK_SERVER_URL) : undefined
)

const legalEntityManagementAPI = new LegalEntityManagementAPI(client)

export async function createLegalEntity(legalEntityInfo: LegalEntityInfoRequiredType): Promise<LegalEntity> {
  return legalEntityManagementAPI.LegalEntitiesApi.createLegalEntity(legalEntityInfo)
}
