import { Client, EnvironmentEnum, ManagementAPI } from '@adyen/api-library'

const ADYEN_COMPANY_ACCOUNT_API_KEY = process.env.ADYEN_COMPANY_ACCOUNT_API_KEY
const ADYEN_ENVIRONMENT = process.env.ADYEN_ENVIRONMENT === 'LIVE' ? EnvironmentEnum.LIVE : EnvironmentEnum.TEST

const client = new Client({ apiKey: ADYEN_COMPANY_ACCOUNT_API_KEY, environment: ADYEN_ENVIRONMENT })

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const managementAPI = new ManagementAPI(client)
