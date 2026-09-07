import { AdyenAccountSetupTaskNameData } from '@models/gateway-account/dto/AdyenAccountSetup.dto'
import { AdyenAccountSetupTaskStatus } from '@models/gateway-account/AdyenAccountSetup.class'

export interface AdyenAccountSetupUpdate {
  op: 'replace'
  path: AdyenAccountSetupTaskNameData
  value: AdyenAccountSetupTaskStatus
}
