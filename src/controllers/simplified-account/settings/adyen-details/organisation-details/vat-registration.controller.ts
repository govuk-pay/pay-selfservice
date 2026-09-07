import { response } from '@utils/response'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import type { ServiceRequest, ServiceResponse } from '@utils/types/express'

export function get(req: ServiceRequest, res: ServiceResponse) {
  return response(req, res, 'simplified-account/settings/adyen-details/vat-registration-number', {
    vatRegistrationNumber: '',
    backLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.adyenDetails.organisationDetails.companyRegistration,
      req.service.externalId,
      req.account.type,
      req.account.getSwitchingCredential().externalId
    ),
  })
}

export function post(req: ServiceRequest, res: ServiceResponse) {
  return res.redirect(
    formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.switchPsp.switchToAdyen.index,
      req.service.externalId,
      req.account.type,
      req.account.getSwitchingCredential().externalId
    )
  )
}
