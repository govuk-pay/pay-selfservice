import type { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { response } from '@utils/response'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { markTaskAsComplete } from '@services/adyen-setup.service'
import { adyenDetailsSchema } from '@utils/simplified-account/validation/adyen-details.schema'
import { validationResult } from 'express-validator'
import { formatValidationErrors } from '@utils/simplified-account/format'

function getBackLink(req: ServiceRequest) {
  return formatServiceAndAccountPathsFor(
    paths.simplifiedAccount.settings.adyenDetails.organisationDetails.vatRegistration,
    req.service.externalId,
    req.account.type,
    req.account.getSwitchingCredential().externalId
  )
}

function get(req: ServiceRequest, res: ServiceResponse) {
  return response(req, res, 'simplified-account/settings/adyen-details/reason-for-taking-payments', {
    backLink: getBackLink(req),
  })
}

async function post(req: ServiceRequest, res: ServiceResponse) {
  const { account } = req

  const validations = [adyenDetailsSchema.selectTakingPaymentsFor.validate]

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
  const switchingCredentialId = account.getSwitchingCredential().externalId

  await markTaskAsComplete(req.service.externalId, req.account.type, switchingCredentialId, 'organisationDetails')
  return res.redirect(
    formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.switchPsp.switchToAdyen.index,
      req.service.externalId,
      req.account.type
    )
  )
}

export { get, post }
