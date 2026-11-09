import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { NotRegisteredForVatBody, OrganisationDetailsSession } from './constants'
import { response } from '@utils/response'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'

export function get(req: ServiceRequest, res: ServiceResponse) {
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

  return response(req, res, 'simplified-account/settings/adyen-details/not-registered-for-vat', {
    backLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.adyenDetails.organisationDetails.registeredForVat,
      req.service.externalId,
      req.account.type,
      req.account.getSwitchingCredential().externalId
    ),
  })
}

export function post(req: ServiceRequest<NotRegisteredForVatBody>, res: ServiceResponse) {
  const { account } = req
  const switchingCredentialId = account.getSwitchingCredential().externalId
  const existingSession = OrganisationDetailsSession.extract(req)

  OrganisationDetailsSession.set(req, existingSession, {
    notRegisteredForVat: req.body.notRegisteredForVat,
  } as OrganisationDetailsSession)

  const nextPagePath = formatServiceAndAccountPathsFor(
    paths.simplifiedAccount.settings.adyenDetails.organisationDetails.hasCompanyRegistration,
    req.service.externalId,
    req.account.type,
    switchingCredentialId
  )

  return res.redirect(`${nextPagePath}?from=not-registered`)
}
