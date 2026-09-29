import { Config } from '@adyen/api-library'
import axios from 'axios'
import { IRequest } from '@adyen/api-library/lib/src/typings/requestOptions'

const MOCK_SERVER_URL = process.env.CONNECTOR_URL

export class AdyenMockHttpClient {
  async request(
    endpoint: string,
    json: string | Buffer,
    _config: Config,
    _isApiKeyRequired: boolean,
    _requestOptions?: IRequest.Options
  ): Promise<string> {
    const path = new URL(endpoint).pathname

    const response = await axios.post(`${MOCK_SERVER_URL}${path}`, json, {
      headers: { 'Content-Type': 'application/json' },
      validateStatus: () => true,
    })

    if (response.status >= 400) {
      const error = new Error(`Adyen mock request failed: ${response.status}`)
      Object.assign(error, { statusCode: response.status, responseBody: JSON.stringify(response.data) })
      throw error
    }

    return JSON.stringify(response.data)
  }
}
