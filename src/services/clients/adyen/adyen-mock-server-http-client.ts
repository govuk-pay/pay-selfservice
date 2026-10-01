import { Config } from '@adyen/api-library'
import axios from 'axios'
import { URLSearchParams } from 'url'
import ClientInterface from '@adyen/api-library/lib/src/httpClient/clientInterface'
import HttpClientException from '@adyen/api-library/lib/src/httpClient/httpClientException'
import { IRequest } from '@adyen/api-library/lib/src/typings/requestOptions'

/**
 * Router for Adyen requests to our local mock server.
 *
 */
export class AdyenMockServerHttpClient implements ClientInterface {
  constructor(private readonly mockServerUrl: string) {}

  async request(
    endpoint: string,
    json: string | Buffer,
    _config: Config,
    _isApiKeyRequired: boolean,
    requestOptions?: IRequest.Options
  ): Promise<string> {
    const url = new URL(endpoint)
    const response = await axios.request<string>({
      url: `${this.mockServerUrl}${url.pathname}`,
      method: requestOptions?.method ?? 'POST',
      params: new URLSearchParams(requestOptions?.params ?? url.search),
      data: json,
      headers: { 'Content-Type': 'application/json' },
      responseType: 'text',
      transformResponse: (body: string) => body,
      validateStatus: () => true,
    })

    if (response.status >= 400) {
      throw new HttpClientException({
        message: `Adyen mock server request failed: ${response.status}`,
        statusCode: response.status,
        responseBody: response.data,
      })
    }

    return response.data
  }
}
