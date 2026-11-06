import { response } from '@utils/response'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import type { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { HasCompanyRegistrationBody, OrganisationDetailsSession } from '../constants'

export function get(req: ServiceRequest, res: ServiceResponse) {
  const { account } = req
  const switchingCredentialId = account.getSwitchingCredential().externalId
  const currentSession = OrganisationDetailsSession.extract(req)

  if (currentSession.isEmpty()) {
    return res.redirect(
      formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.switchPsp.switchToAdyen.index,
        req.service.externalId,
        req.account.type
      )
    )
  }

  return response(
    req,
    res,
    'simplified-account/settings/adyen-details/company-registration/has-company-registration-number',
    {
      hasCompanyRegistrationNumber: currentSession.hasCompanyRegistrationNumber ?? '',
      backLink: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.adyenDetails.organisationDetails.registeredForVat,
        req.service.externalId,
        req.account.type,
        switchingCredentialId
      ),
    }
  )
}

export function post(req: ServiceRequest<HasCompanyRegistrationBody>, res: ServiceResponse) {
  const { account } = req
  const switchingCredentialId = account.getSwitchingCredential().externalId
  const existingSession = OrganisationDetailsSession.extract(req)

  const updatedSession = {
    hasCompanyRegistrationNumber: req.body.hasCompanyRegistrationNumber,
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
        paths.simplifiedAccount.settings.adyenDetails.organisationDetails.uploadCompanyRegistration,
        req.service.externalId,
        req.account.type,
        switchingCredentialId
      )

  return res.redirect(redirectPath)
}
