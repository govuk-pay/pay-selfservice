import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { response } from '@utils/response'
import { AdyenTasks } from '@models/task-workflows/AdyenTasks.class'
import { ResponsiblePersonSession } from '../../adyen-details/responsible-person/constants'
import { getConnectorAdyenAccountSetup } from '@services/adyen-setup.service'
import { ServiceDirectorSession } from '../../adyen-details/service-director/constants'

async function get(req: ServiceRequest, res: ServiceResponse) {
  const accountSetup = await getConnectorAdyenAccountSetup(
    req.service.externalId,
    req.account.type,
    req.account.getSwitchingCredential().externalId
  )
  const adyenTasks = AdyenTasks.forProviderSwitching(req.service, req.account, accountSetup)
  ResponsiblePersonSession.clear(req)
  ServiceDirectorSession.clear(req)

  return response(req, res, 'simplified-account/settings/switch-psp/switch-to-adyen/index.njk', {
    currentPsp: req.account.paymentProvider,
    adyenTasks,
  })
}

export { get }
