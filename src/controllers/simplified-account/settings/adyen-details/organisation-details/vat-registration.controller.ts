import { response } from '@utils/response'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import type { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { OrganisationDetailsSession, VatRegistrationBody } from './constants'
import { createOrganisation } from '@services/adyen-details.service'
import { markTaskAsComplete } from '@services/adyen-setup.service'

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

  return response(req, res, 'simplified-account/settings/adyen-details/vat-registration-number', {
    vatRegistrationNumber: currentSession.vatRegistrationNumber ?? '',
    backLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.adyenDetails.organisationDetails.companyRegistration,
      req.service.externalId,
      req.account.type,
      switchingCredentialId
    ),
  })
}

export async function post(req: ServiceRequest<VatRegistrationBody>, res: ServiceResponse) {
  const { account } = req
  const switchingCredentialId = account.getSwitchingCredential().externalId
  const currentSession = OrganisationDetailsSession.extract(req)

  const completeSession = new OrganisationDetailsSession({
    ...currentSession,
    vatRegistrationNumber: req.body.vatRegistrationNumber,
  } as OrganisationDetailsSession)

  await createOrganisation(completeSession)
  await markTaskAsComplete(req.service.externalId, req.account.type, switchingCredentialId, 'organisationDetails')

  OrganisationDetailsSession.clear(req)

  return res.redirect(
    formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.switchPsp.switchToAdyen.index,
      req.service.externalId,
      req.account.type
    )
  )
}
