import { response } from '@utils/response'
import type { ServiceRequest, ServiceResponse } from '@utils/types/express'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { utils } from '@govuk-pay/pay-js-commons'
import { OrganisationDetailsBody, OrganisationDetailsSession } from './constants'

export function get(req: ServiceRequest, res: ServiceResponse) {
  const currentSession = OrganisationDetailsSession.extract(req)

  const organisationDetails = {
    organisationName: currentSession.organisationName ?? '',
    addressLine1: currentSession.addressLine1 ?? '',
    addressLine2: currentSession.addressLine2 ?? '',
    addressCity: currentSession.addressCity ?? '',
    addressPostcode: currentSession.addressPostcode ?? '',
    addressCountry: currentSession.addressCountry ?? 'GB',
    email: currentSession.email ?? '',
  }

  return response(req, res, 'simplified-account/settings/adyen-details/organisation-details', {
    organisationDetails,
    hasCompanyRegistrationNumber: currentSession.hasCompanyRegistrationNumber ?? '',
    countries: utils.countries.govukFrontendFormatted(organisationDetails.addressCountry),
    backLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.switchPsp.switchToAdyen.index,
      req.service.externalId,
      req.account.type
    ),
  })
}

export function post(req: ServiceRequest<OrganisationDetailsBody>, res: ServiceResponse) {
  const { account } = req
  const switchingCredentialId = account.getSwitchingCredential().externalId
  const existingSession = OrganisationDetailsSession.extract(req)

  const updatedSession = {
    organisationName: req.body.organisationName,
    addressLine1: req.body.addressLine1,
    addressLine2: req.body.addressLine2,
    addressCity: req.body.addressCity,
    addressPostcode: req.body.addressPostcode,
    addressCountry: req.body.addressCountry,
    hasCompanyRegistrationNumber: req.body.hasCompanyRegistrationNumber,
    email: req.body.email,
  } as OrganisationDetailsSession

  OrganisationDetailsSession.set(req, existingSession, updatedSession)

  const hasCompanyRegistrationNumber = req.body.hasCompanyRegistrationNumber === 'true'

  const redirectPath = hasCompanyRegistrationNumber
    ? formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.adyenDetails.organisationDetails.companyRegistration,
        req.service.externalId,
        req.account.type,
        switchingCredentialId
      )
    : formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.adyenDetails.organisationDetails.vatRegistration,
        req.service.externalId,
        req.account.type,
        switchingCredentialId
      )

  return res.redirect(redirectPath)
}
