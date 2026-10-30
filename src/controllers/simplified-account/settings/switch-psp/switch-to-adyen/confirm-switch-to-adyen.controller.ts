import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { response } from '@utils/response'
import { AdyenTasks } from '@models/task-workflows/AdyenTasks.class'
import { getConnectorAdyenAccountSetup } from '@services/adyen-setup.service'
import { AdyenTaskIdentifier } from '@models/task-workflows/task-identifiers/adyen-task-identifiers'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { completePaymentServiceProviderSwitch } from '@services/gateway-accounts.service'
import GatewayAccountSwitchPaymentProviderRequest from '@models/gateway-account/GatewayAccountSwitchPaymentProviderRequest.class'

async function get(req: ServiceRequest, res: ServiceResponse) {
  const accountSetup = await getConnectorAdyenAccountSetup(
    req.service.externalId,
    req.account.type,
    req.account.getSwitchingCredential().externalId
  )
  const adyenTasks = await AdyenTasks.forProviderSwitching(req.service, req.account, accountSetup)

  if (!adyenTasks.findTaskById(AdyenTaskIdentifier.FINISH_SWITCHING).canStart()) {
    req.flash('messages', {
      state: 'error',
      heading: 'There is a problem',
      body: 'You cannot switch providers until all required tasks are completed',
    })
    return res.redirect(
      formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.switchPsp.switchToStripe.index,
        req.service.externalId,
        req.account.type
      )
    )
  }

  return response(req, res, 'simplified-account/settings/switch-psp/switch-to-adyen/confirm', {
    backLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.switchPsp.switchToStripe.index,
      req.service.externalId,
      req.account.type
    ),
  })
}

async function post(req: ServiceRequest, res: ServiceResponse) {
  const switchingCredentialId = req.account.getSwitchingCredential().externalId
  const accountSetup = await getConnectorAdyenAccountSetup(
    req.service.externalId,
    req.account.type,
    switchingCredentialId
  )
  const adyenTasks = await AdyenTasks.forProviderSwitching(req.service, req.account, accountSetup)

  if (!adyenTasks.findTaskById(AdyenTaskIdentifier.FINISH_SWITCHING).canStart()) {
    req.flash('messages', {
      state: 'error',
      heading: 'There is a problem',
      body: 'You cannot switch providers until all required tasks are completed',
    })
    return res.redirect(
      formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.switchPsp.switchToStripe.index,
        req.service.externalId,
        req.account.type
      )
    )
  }

  const switchProviderRequest = new GatewayAccountSwitchPaymentProviderRequest()
    .withUserExternalId(req.user.externalId)
    .withGatewayAccountCredentialExternalId(switchingCredentialId)

  await completePaymentServiceProviderSwitch(req.service.externalId, req.account.type, switchProviderRequest)

  req.flash('messages', {
    state: 'success',
    icon: '&check;',
    heading: `Service connected to Adyen`,
    body: 'This service can now take payments',
  })

  return res.redirect(
    formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.adyenDetails.index,
      req.service.externalId,
      req.account.type
    )
  )
}

export { get, post }
