import type { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { response } from '@utils/response'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { FROM_REVIEW_QUERY_PARAM, ResponsiblePersonSession } from './constants'
import {
  adyenResponsiblePersonSchema,
  ResponsiblePersonDetailsBody,
} from '@utils/simplified-account/validation/adyen/adyen-responsible-person.schema'
import { validationResult } from 'express-validator'
import formatValidationErrors from '../../../../../utils/simplified-account/format/format-validation-errors'

function getBackLink(req: ServiceRequest<unknown>) {
  const switchToAdyenLink = formatServiceAndAccountPathsFor(
    paths.simplifiedAccount.settings.switchPsp.switchToAdyen.index,
    req.service.externalId,
    req.account.type
  )

  const reviewLink = formatServiceAndAccountPathsFor(
    paths.simplifiedAccount.settings.adyenDetails.responsiblePerson.checkYourAnswers,
    req.service.externalId,
    req.account.type,
    req.account.getSwitchingCredential().externalId
  )

  return req.query[FROM_REVIEW_QUERY_PARAM] === 'true' ? reviewLink : switchToAdyenLink
}

function get(req: ServiceRequest, res: ServiceResponse) {
  const currentSession = ResponsiblePersonSession.extract(req)

  const name = {
    firstName: currentSession.firstName ?? '',
    lastName: currentSession.lastName ?? '',
  }

  const dob = {
    dobDay: currentSession.dobDay ?? '',
    dobMonth: currentSession.dobMonth ?? '',
    dobYear: currentSession.dobYear ?? '',
  }

  return response(req, res, 'simplified-account/settings/adyen-details/responsible-person/index', {
    backLink: getBackLink(req),
    name,
    dob,
  })
}

const validations = [
  adyenResponsiblePersonSchema.details.firstName.validate,
  adyenResponsiblePersonSchema.details.lastName.validate,
  adyenResponsiblePersonSchema.details.dob.validate,
  adyenResponsiblePersonSchema.details.dobDay.validate,
  adyenResponsiblePersonSchema.details.dobMonth.validate,
  adyenResponsiblePersonSchema.details.dobYear.validate,
]

async function post(req: ServiceRequest<ResponsiblePersonDetailsBody>, res: ServiceResponse) {
  const { account } = req
  const switchingCredentialId = account.getSwitchingCredential().externalId
  const currentSession = ResponsiblePersonSession.extract(req)

  await Promise.all(validations.map((validation) => validation.run(req)))
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors)
    console.log(errors)

    return response(req, res, 'simplified-account/settings/adyen-details/responsible-person/index', {
      errors: {
        summary: formattedErrors.errorSummary,
        formErrors: formattedErrors.formErrors,
      },
      backLink: getBackLink(req),
      name: {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
      },
      dob: {
        dobDay: req.body.dobDay,
        dobMonth: req.body.dobMonth,
        dobYear: req.body.dobYear,
      },
    })
  }

  ResponsiblePersonSession.set(req, currentSession, {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    dobDay: req.body.dobDay,
    dobMonth: req.body.dobMonth,
    dobYear: req.body.dobYear,
  } as ResponsiblePersonSession)

  return res.redirect(
    formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.adyenDetails.responsiblePerson.address,
      req.service.externalId,
      req.account.type,
      switchingCredentialId
    )
  )
}

export { get, post }
