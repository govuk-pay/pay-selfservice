import { response } from '@utils/response'
import type { ServiceRequest, ServiceResponse } from '@utils/types/express'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'

export function get(req: ServiceRequest, res: ServiceResponse) {
  return response(req, res, 'simplified-account/settings/adyen-details/organisation-details', {
    organisationDetails: {
      organisationName: '',
      addressLine1: '',
      addressLine2: '',
      addressCity: '',
      addressPostcode: '',
      addressCountry: 'GB',
    },
    countries: [],
    backLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.switchPsp.switchToAdyen.index,
      req.service.externalId,
      req.account.type
    ),
  })
}

// revist res
export function post(req: ServiceRequest, res: ServiceResponse) {
  return res.redirect(
    formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.adyenDetails.organisationDetails.companyRegistration,
      req.service.externalId,
      req.account.type,
      req.account.getSwitchingCredential().externalId
    )
  )
}
