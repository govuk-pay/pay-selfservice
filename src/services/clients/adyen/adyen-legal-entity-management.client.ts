import { Client, EnvironmentEnum, HttpURLConnectionClient, LegalEntityManagementAPI, Types } from '@adyen/api-library'
import { TransferInstrumentInfo } from '@adyen/api-library/lib/src/typings/legalEntityManagement/transferInstrumentInfo'
import { AdyenMockServerHttpClient } from '@services/clients/adyen/adyen-mock-server-http-client'
import { AdyenAPI, AdyenRequest, Metadata } from '@services/clients/adyen/adyen-request-wrapper'
import { BusinessLineInfo } from '@adyen/api-library/lib/src/typings/legalEntityManagement/businessLineInfo'

const ADYEN_LEGAL_ENTITY_MANAGEMENT_API_KEY = process.env.ADYEN_LEGAL_ENTITY_MANAGEMENT_API_KEY
const ADYEN_ENVIRONMENT = process.env.ADYEN_ENVIRONMENT === 'LIVE' ? EnvironmentEnum.LIVE : EnvironmentEnum.TEST
const ADYEN_MOCK_SERVER_URL = process.env.ADYEN_MOCK_SERVER_URL

type LegalEntity = Types.legalEntityManagement.LegalEntity
type LegalEntityInfo = Types.legalEntityManagement.LegalEntityInfo
type LegalEntityInfoRequiredType = Types.legalEntityManagement.LegalEntityInfoRequiredType
type GeneratePciDescriptionResponse = Types.legalEntityManagement.GeneratePciDescriptionResponse
type PciSigningRequest = Types.legalEntityManagement.PciSigningRequest
type PciSigningResponse = Types.legalEntityManagement.PciSigningResponse

const client = new Client(
  { apiKey: ADYEN_LEGAL_ENTITY_MANAGEMENT_API_KEY, environment: ADYEN_ENVIRONMENT },
  ADYEN_MOCK_SERVER_URL ? new AdyenMockServerHttpClient(ADYEN_MOCK_SERVER_URL) : undefined
)

if (
  process.env.HTTPS_PROXY_HOST &&
  process.env.HTTPS_PROXY_PORT &&
  Number.isInteger(Number(process.env.HTTPS_PROXY_PORT))
) {
  const httpClient = new HttpURLConnectionClient()
  httpClient.proxy = { host: process.env.HTTPS_PROXY_HOST, port: Number(process.env.HTTPS_PROXY_PORT) }

  client.httpClient = httpClient
}

const legalEntityManagementAPI = new LegalEntityManagementAPI(client)

export async function createLegalEntity(legalEntityInfo: LegalEntityInfoRequiredType): Promise<LegalEntity> {
  return new AdyenRequest(AdyenAPI.LEGAL_ENTITY_MANAGEMENT, 'create legal entity', Metadata.Post()).execute(() =>
    legalEntityManagementAPI.LegalEntitiesApi.createLegalEntity(legalEntityInfo)
  )
}

export async function getLegalEntity(legalEntityId: string): Promise<LegalEntity> {
  return new AdyenRequest(
    AdyenAPI.LEGAL_ENTITY_MANAGEMENT,
    'get legal entity',
    Metadata.Get({ legal_entity_id: legalEntityId })
  ).execute(() => legalEntityManagementAPI.LegalEntitiesApi.getLegalEntity(legalEntityId))
}

export async function getTransferInstrument(transferInstrumentId: string): Promise<TransferInstrumentInfo> {
  return new AdyenRequest(
    AdyenAPI.LEGAL_ENTITY_MANAGEMENT,
    'get transfer instrument',
    Metadata.Get({ transfer_instrument_id: transferInstrumentId })
  ).execute(() => legalEntityManagementAPI.TransferInstrumentsApi.getTransferInstrument(transferInstrumentId))
}

export async function updateLegalEntity(legalEntityId: string, legalEntityInfo: LegalEntityInfo): Promise<LegalEntity> {
  return new AdyenRequest(
    AdyenAPI.LEGAL_ENTITY_MANAGEMENT,
    'update legal entity',
    Metadata.Patch({ legal_entity_id: legalEntityId })
  ).execute(() => legalEntityManagementAPI.LegalEntitiesApi.updateLegalEntity(legalEntityId, legalEntityInfo))
}

export async function createTransferInstrument(transferInstrumentInfo: TransferInstrumentInfo) {
  return new AdyenRequest(AdyenAPI.LEGAL_ENTITY_MANAGEMENT, 'create transfer instrument', Metadata.Post()).execute(() =>
    legalEntityManagementAPI.TransferInstrumentsApi.createTransferInstrument(transferInstrumentInfo)
  )
}

export async function createBusinessLine(businessLineInfo: BusinessLineInfo) {
  return new AdyenRequest(AdyenAPI.LEGAL_ENTITY_MANAGEMENT, 'create business line', Metadata.Post()).execute(() =>
    legalEntityManagementAPI.BusinessLinesApi.createBusinessLine(businessLineInfo)
  )
}

export async function generatePciQuestionnaire(legalEntityId: string): Promise<GeneratePciDescriptionResponse> {
  return new AdyenRequest(
    AdyenAPI.LEGAL_ENTITY_MANAGEMENT,
    'generate PCI questionnaire',
    Metadata.Get({ legal_entity_id: legalEntityId })
  ).execute(() =>
    legalEntityManagementAPI.PCIQuestionnairesApi.generatePciQuestionnaire(legalEntityId, {
      additionalSalesChannels: [
        Types.legalEntityManagement.GeneratePciDescriptionRequest.AdditionalSalesChannelsEnum.ECommerce,
      ],
    })
  )
}

export async function signPciQuestionnaire(
  legalEntityId: string,
  pciSigningRequest: PciSigningRequest
): Promise<PciSigningResponse> {
  return new AdyenRequest(
    AdyenAPI.LEGAL_ENTITY_MANAGEMENT,
    'sign PCI questionnaire',
    Metadata.Post({ legal_entity_id: legalEntityId })
  ).execute(() => legalEntityManagementAPI.PCIQuestionnairesApi.signPciQuestionnaire(legalEntityId, pciSigningRequest))
}

export async function getTermsOfService(
  legalEntityId: string,
  getTermsOfServiceDocumentRequest: Types.legalEntityManagement.GetTermsOfServiceDocumentRequest
) {
  return new AdyenRequest(
    AdyenAPI.LEGAL_ENTITY_MANAGEMENT,
    'get terms of service',
    Metadata.Get({ legal_entity_id: legalEntityId })
  ).execute(() =>
    legalEntityManagementAPI.TermsOfServiceApi.getTermsOfServiceDocument(
      legalEntityId,
      getTermsOfServiceDocumentRequest
    )
  )
}

export async function acceptTermsOfService(
  legalEntityId: string,
  termsOfServiceDocumentId: string,
  acceptTermsOfServiceRequest: Types.legalEntityManagement.AcceptTermsOfServiceRequest
) {
  return new AdyenRequest(
    AdyenAPI.LEGAL_ENTITY_MANAGEMENT,
    'accept terms of service',
    Metadata.Post({ legal_entity_id: legalEntityId, document_id: termsOfServiceDocumentId })
  ).execute(() =>
    legalEntityManagementAPI.TermsOfServiceApi.acceptTermsOfService(
      legalEntityId,
      termsOfServiceDocumentId,
      acceptTermsOfServiceRequest
    )
  )
}
