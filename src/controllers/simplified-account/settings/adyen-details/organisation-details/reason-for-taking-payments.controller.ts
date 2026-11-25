import type { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { response } from '@utils/response'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { adyenDetailsSchema } from '@utils/simplified-account/validation/adyen-details.schema'
import { validationResult } from 'express-validator'
import { formatValidationErrors } from '@utils/simplified-account/format'
import { OrganisationDetailsSession, GovernmentActivityBody } from './constants'

function getBackLink(req: ServiceRequest<GovernmentActivityBody>) {
  return formatServiceAndAccountPathsFor(
    paths.simplifiedAccount.settings.adyenDetails.organisationDetails.review,
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

  return response(req, res, 'simplified-account/settings/adyen-details/reason-for-taking-payments', {
    governmentActivity: currentSession.governmentActivity ?? '',
    backLink: getBackLink(req),
  })
}

async function post(req: ServiceRequest<GovernmentActivityBody>, res: ServiceResponse) {
  const { account } = req
  const switchingCredentialId = account.getSwitchingCredential().externalId
  const existingSession = OrganisationDetailsSession.extract(req)

  const validations = [adyenDetailsSchema.selectGovernmentActivity.validate]

  await Promise.all(validations.map((validation) => validation.run(req)))
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors)

    return response(req, res, 'simplified-account/settings/adyen-details/reason-for-taking-payments', {
      errors: {
        summary: formattedErrors.errorSummary,
        formErrors: formattedErrors.formErrors,
      },
      backLink: getBackLink(req),
    })
  }

  const updatedSession = {
    governmentActivity: req.body.governmentActivity,
  } as OrganisationDetailsSession

  OrganisationDetailsSession.set(req, existingSession, updatedSession)

  return res.redirect(
    formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.adyenDetails.organisationDetails.registeredForVat,
      req.service.externalId,
      req.account.type,
      switchingCredentialId
    )
  )
}

export { get, post }
