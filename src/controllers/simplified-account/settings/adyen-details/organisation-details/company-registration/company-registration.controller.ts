import { response } from '@utils/response'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import type { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { CompanyRegistrationBody, OrganisationDetailsSession } from '../constants'
import { submitOrganisationDetails } from './utils'

function get(req: ServiceRequest, res: ServiceResponse) {
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
    'simplified-account/settings/adyen-details/company-registration/company-registration-number',
    {
      companyRegistrationNumber: currentSession.companyRegistrationNumber ?? '',
      backLink: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.adyenDetails.organisationDetails.hasCompanyRegistration,
        req.service.externalId,
        req.account.type,
        switchingCredentialId
      ),
    }
  )
}

async function post(req: ServiceRequest<CompanyRegistrationBody>, res: ServiceResponse) {
  const { account } = req
  const switchingCredentialId = account.getSwitchingCredential().externalId
  const existingSession = OrganisationDetailsSession.extract(req)

  const completeSession = new OrganisationDetailsSession({
    ...existingSession,
    companyRegistrationNumber: req.body.companyRegistrationNumber,
  })

  OrganisationDetailsSession.set(req, completeSession)

  await submitOrganisationDetails(req.service, req.account, req.user.externalId, completeSession, switchingCredentialId)

  OrganisationDetailsSession.clear(req)

  return res.redirect(
    formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.switchPsp.switchToAdyen.index,
      req.service.externalId,
      req.account.type,
      switchingCredentialId
    )
  )
}

export { get, post }
