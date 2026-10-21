import { Client, EnvironmentEnum, HttpURLConnectionClient, ManagementAPI } from '@adyen/api-library'
import { PaymentMethod } from '@adyen/api-library/lib/src/typings/checkout/paymentMethod'
import { PaymentMethodSetupInfo } from '@adyen/api-library/lib/src/typings/management/paymentMethodSetupInfo'
import { AdyenAPI, AdyenRequest } from './adyen-request-wrapper'

const ADYEN_COMPANY_ACCOUNT_API_KEY = process.env.ADYEN_COMPANY_ACCOUNT_API_KEY
const ADYEN_ENVIRONMENT = process.env.ADYEN_ENVIRONMENT === 'LIVE' ? EnvironmentEnum.LIVE : EnvironmentEnum.TEST

const client = new Client({ apiKey: ADYEN_COMPANY_ACCOUNT_API_KEY, environment: ADYEN_ENVIRONMENT })

if (
  process.env.HTTPS_PROXY_HOST &&
  process.env.HTTPS_PROXY_PORT &&
  Number.isInteger(Number(process.env.HTTPS_PROXY_PORT))
) {
  const httpClient = new HttpURLConnectionClient()
  httpClient.proxy = { host: process.env.HTTPS_PROXY_HOST, port: Number(process.env.HTTPS_PROXY_PORT) }

  client.httpClient = httpClient
}

const managementAPI = new ManagementAPI(client)

export async function requestPaymentMethod(
  merchantId: string,
  paymentMethodSetupInfo: PaymentMethodSetupInfo
): Promise<PaymentMethod> {
  return new AdyenRequest(AdyenAPI.MANAGEMENT, 'request payment method').execute(() =>
    managementAPI.PaymentMethodsMerchantLevelApi.requestPaymentMethod(merchantId, paymentMethodSetupInfo)
  )
}
