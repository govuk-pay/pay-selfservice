import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { OrganisationDetailsSession, RegisteredForVatBody } from './constants'
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

  return response(req, res, 'simplified-account/settings/adyen-details/registered-for-vat', {
    backLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.adyenDetails.organisationDetails.reasonForTakingPayments,
      req.service.externalId,
      req.account.type,
      req.account.getSwitchingCredential().externalId
    ),
  })
}

export function post(req: ServiceRequest<RegisteredForVatBody>, res: ServiceResponse) {
  const { account } = req
  const switchingCredentialId = account.getSwitchingCredential().externalId

  const isOrgRegisteredForVAT = req.body.registeredForVat === 'true'

  const redirectPath = isOrgRegisteredForVAT
    ? formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.adyenDetails.organisationDetails.vatRegistrationNumber,
        req.service.externalId,
        req.account.type,
        switchingCredentialId
      )
    : formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.adyenDetails.organisationDetails.notRegisteredForVat,
        req.service.externalId,
        req.account.type,
        switchingCredentialId
      )

  return res.redirect(redirectPath)
}
