import { response } from '@utils/response'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import type { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { OrganisationDetailsSession, VatRegistrationBody } from './constants'
import { ADYEN_VAT_REGISTRATION_NUMBER_VALIDATIONS } from '@utils/simplified-account/validation/adyen/adyen-vat-registration-number.schema'
import { validationResult } from 'express-validator'
import { formatValidationErrors } from '@utils/simplified-account/format'

function getBackLink(req: ServiceRequest<unknown>, currentSession: OrganisationDetailsSession) {
  const switchingCredentialId = req.account.getSwitchingCredential().externalId
  const backPath =
    currentSession.hasCompanyRegistrationNumber === 'true'
      ? paths.simplifiedAccount.settings.adyenDetails.organisationDetails.companyRegistration
      : paths.simplifiedAccount.settings.adyenDetails.organisationDetails.index

  return formatServiceAndAccountPathsFor(backPath, req.service.externalId, req.account.type, switchingCredentialId)
}

function get(req: ServiceRequest, res: ServiceResponse) {
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
    backLink: getBackLink(req, currentSession),
  })
}

async function post(req: ServiceRequest<VatRegistrationBody>, res: ServiceResponse) {
  const { account } = req
  const switchingCredentialId = account.getSwitchingCredential().externalId
  const currentSession = OrganisationDetailsSession.extract(req)

  for (const validation of ADYEN_VAT_REGISTRATION_NUMBER_VALIDATIONS) {
    await validation.run(req)
  }
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors)

    return response(req, res, 'simplified-account/settings/adyen-details/vat-registration-number', {
      errors: {
        summary: formattedErrors.errorSummary,
        formErrors: formattedErrors.formErrors,
      },
      vatRegistrationNumber: req.body.vatRegistrationNumber,
      backLink: getBackLink(req, currentSession),
    })
  }

  OrganisationDetailsSession.set(req, currentSession, {
    vatRegistrationNumber: req.body.vatRegistrationNumber,
  } as OrganisationDetailsSession)

  return res.redirect(
    formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.adyenDetails.organisationDetails.reasonForTakingPayments,
      req.service.externalId,
      req.account.type,
      switchingCredentialId
    )
  )
}

export { get, post }
