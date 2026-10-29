import createLogger from '@utils/logger'
import { AdyenApiError } from '@root/errors'
import HttpClientException from '@adyen/api-library/lib/src/httpClient/httpClientException'

const logger = createLogger('adyen-request-wrapper.ts')

type Metadata = Record<string, string> & {
  adyen_api_method: string
}

export const Metadata = {
  Get: (metadata: Record<string, string>): Metadata => {
    return {
      adyen_api_method: 'GET',
      ...metadata,
    }
  },

  Post: (metadata: Record<string, string> = {}): Metadata => {
    return {
      adyen_api_method: 'POST',
      ...metadata,
    }
  },

  Patch: (metadata: Record<string, string> = {}): Metadata => {
    return {
      adyen_api_method: 'PATCH',
      ...metadata,
    }
  },
}

export class AdyenRequest {
  readonly adyenApi: AdyenAPI
  readonly requestDescription: string
  readonly metadata: Metadata

  constructor(adyenApi: AdyenAPI, requestDescription: string, metadata: Metadata = { adyen_api_method: 'UNKNOWN' }) {
    this.adyenApi = adyenApi
    this.requestDescription = requestDescription
    this.metadata = metadata
  }

  async execute<T>(executor: () => Promise<T>): Promise<T> {
    const startTime = Date.now()

    logger.info(`Calling Adyen to ${this.requestDescription}`, {
      adyen_api: this.adyenApi.toLowerCase(),
      description: this.requestDescription,
      ...this.metadata,
    })

    return executor()
      .catch((error: HttpClientException) => {
        logger.info(`Calling Adyen to ${this.requestDescription} failed`, {
          adyen_api: this.adyenApi.toLowerCase(),
          description: this.requestDescription,
          error: error.message,
          adyen_error: {
            status_code: error.apiError?.status,
            error_code: error.apiError?.errorCode,
            message: error.apiError?.message,
            detail: error.apiError?.detail,
            error_type: error.apiError?.errorType,
            psp_reference: error.apiError?.pspReference,
            instance: error.apiError?.instance,
            invalid_fields: error.apiError?.invalidFields,
            request_id: error.apiError?.requestId,
            title: error.apiError?.title,
            type: error.apiError?.type,
            error_body: error.responseBody,
            name: error.name,
          },
          ...this.metadata,
        })
        throw new AdyenApiError(error.message)
      })
      .finally(() => {
        const responseTime = Date.now() - startTime
        logger.info(`Calling Adyen to ${this.requestDescription} ended - elapsed time: ${responseTime} ms`, {
          adyen_api: this.adyenApi.toLowerCase(),
          description: this.requestDescription,
          ...this.metadata,
        })
      })
  }
}

export const AdyenAPI = {
  LEGAL_ENTITY_MANAGEMENT: 'LEGAL_ENTITY_MANAGEMENT',
  BALANCE_PLATFORM: 'BALANCE_PLATFORM',
  MANAGEMENT: 'MANAGEMENT',
} as const

type AdyenAPI = (typeof AdyenAPI)[keyof typeof AdyenAPI]
