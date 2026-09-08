import { response } from '@utils/response'
import type { ServiceRequest, ServiceResponse } from '@utils/types/express'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { utils } from '@govuk-pay/pay-js-commons'

const { countries } = utils

export function get(req: ServiceRequest, res: ServiceResponse) {
  const organisationDetails = {
    organisationName: '',
    addressLine1: '',
    addressLine2: '',
    addressCity: '',
    addressPostcode: '',
    addressCountry: 'GB',
  }

  return response(req, res, 'simplified-account/settings/adyen-details/organisation-details', {
    organisationDetails,
    hasCompanyRegistrationNumber: '',
    countries: countries.govukFrontendFormatted(organisationDetails.addressCountry),
    backLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.switchPsp.switchToAdyen.index,
      req.service.externalId,
      req.account.type
    ),
  })
}

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
