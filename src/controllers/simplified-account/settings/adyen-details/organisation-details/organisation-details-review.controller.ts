import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { OrganisationDetailsSession } from './constants'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { response } from '@utils/response'
import { utils } from '@govuk-pay/pay-js-commons'

export function get(req: ServiceRequest, res: ServiceResponse) {
  const { account } = req
  const switchingCredentialId = account.getSwitchingCredential().externalId
  const currentSession = OrganisationDetailsSession.extract(req)

  if (currentSession.isEmpty()) {
    return res.redirect(
      formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.switchPsp.switchToAdyen.index,
        req.service.externalId,
        account.type
      )
    )
  }

  const fullAddress = [
    currentSession.addressLine1,
    currentSession.addressLine2,
    currentSession.addressCity,
    utils.countries
      .govukFrontendFormatted(currentSession.addressCountry ?? 'GB')
      .find((country) => country.value === currentSession.addressCountry)?.text,
    currentSession.addressPostcode,
  ].filter(Boolean)

  return response(req, res, 'simplified-account/settings/adyen-details/organisation-details-review', {
    backLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.adyenDetails.organisationDetails.index,
      req.service.externalId,
      req.account.type,
      switchingCredentialId
    ),
    currentSession,
    fullAddress,
  })
}

export function post(req: ServiceRequest, res: ServiceResponse) {
  const { account } = req
  const switchingCredentialId = account.getSwitchingCredential().externalId
  return res.redirect(
    formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.adyenDetails.organisationDetails.reasonForTakingPayments,
      req.service.externalId,
      account.type,
      switchingCredentialId
    )
  )
}

