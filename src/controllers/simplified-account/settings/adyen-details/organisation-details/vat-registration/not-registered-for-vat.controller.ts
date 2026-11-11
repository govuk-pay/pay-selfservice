import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { NotRegisteredForVatBody, OrganisationDetailsSession } from '../constants'
import { response } from '@utils/response'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { adyenDetailsSchema } from '@utils/simplified-account/validation/adyen-details.schema'
import { validationResult } from 'express-validator'
import formatValidationErrors from '@utils/simplified-account/format/format-validation-errors'

function getBackLink(req: ServiceRequest<NotRegisteredForVatBody>) {
  return formatServiceAndAccountPathsFor(
    paths.simplifiedAccount.settings.adyenDetails.organisationDetails.registeredForVat,
    req.service.externalId,
    req.account.type,
    req.account.getSwitchingCredential().externalId
  )
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

  return response(req, res, 'simplified-account/settings/adyen-details/not-registered-for-vat', {
    backLink: getBackLink(req),
  })
}

async function post(req: ServiceRequest<NotRegisteredForVatBody>, res: ServiceResponse) {
  const { account } = req
  const switchingCredentialId = account.getSwitchingCredential().externalId
  const existingSession = OrganisationDetailsSession.extract(req)

  const validations = [adyenDetailsSchema.notRegisteredForVat.validate]

  await Promise.all(validations.map((validation) => validation.run(req)))
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors)

    return response(req, res, 'simplified-account/settings/adyen-details/not-registered-for-vat', {
      errors: {
        summary: formattedErrors.errorSummary,
        formErrors: formattedErrors.formErrors,
      },
      backLink: getBackLink(req),
    })
  }

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

export { get, post }
