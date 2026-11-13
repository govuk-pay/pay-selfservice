import { response } from '@utils/response'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import type { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { CompanyRegistrationBody, OrganisationDetailsSession } from './constants'
import { ADYEN_COMPANY_REGISTRATION_NUMBER_VALIDATIONS } from '@utils/simplified-account/validation/adyen/adyen-organisation-company-number.schema'
import { validationResult } from 'express-validator'
import { formatValidationErrors } from '@utils/simplified-account/format'

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

  return response(req, res, 'simplified-account/settings/adyen-details/company-registration-number', {
    companyRegistrationNumber: currentSession.companyRegistrationNumber ?? '',
    backLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.adyenDetails.organisationDetails.index,
      req.service.externalId,
      req.account.type,
      switchingCredentialId
    ),
  })
}

export async function post(req: ServiceRequest<CompanyRegistrationBody>, res: ServiceResponse) {
  const { account } = req
  const switchingCredentialId = account.getSwitchingCredential().externalId
  const currentSession = OrganisationDetailsSession.extract(req)

  for (const validation of ADYEN_COMPANY_REGISTRATION_NUMBER_VALIDATIONS) {
    await validation.run(req)
  }
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors)

    return response(req, res, 'simplified-account/settings/adyen-details/company-registration-number', {
      errors: {
        summary: formattedErrors.errorSummary,
        formErrors: formattedErrors.formErrors,
      },
      companyRegistrationNumber: req.body.companyRegistrationNumber,
      backLink: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.adyenDetails.organisationDetails.index,
        req.service.externalId,
        req.account.type,
        switchingCredentialId
      ),
    })
  }

  OrganisationDetailsSession.set(req, currentSession, {
    companyRegistrationNumber: req.body.companyRegistrationNumber,
  } as OrganisationDetailsSession)

  return res.redirect(
    formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.adyenDetails.organisationDetails.vatRegistration,
      req.service.externalId,
      req.account.type,
      switchingCredentialId
    )
  )
}
