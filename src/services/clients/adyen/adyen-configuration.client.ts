import { Client, EnvironmentEnum, BalancePlatformAPI } from '@adyen/api-library'

const ADYEN_BALANCE_PLATFORM_API_KEY = process.env.ADYEN_BALANCE_PLATFORM_API_KEY
const ADYEN_ENVIRONMENT = process.env.ADYEN_ENVIRONMENT === 'LIVE' ? EnvironmentEnum.LIVE : EnvironmentEnum.TEST

const client = new Client({ apiKey: ADYEN_BALANCE_PLATFORM_API_KEY, environment: ADYEN_ENVIRONMENT })

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const balancePlatformAPI = new BalancePlatformAPI(client)
