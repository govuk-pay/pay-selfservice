import type { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { response } from '@utils/response'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { FROM_REVIEW_QUERY_PARAM, ResponsiblePersonSession } from './constants'
import { validationResult } from 'express-validator'
import { ADYEN_RESPONSIBLE_PERSON_PERSONAL_DETAILS_VALIDATIONS } from '@utils/simplified-account/validation/adyen/adyen-responsible-person-personal-details.schema'
import formatValidationErrors from '@utils/simplified-account/format/format-validation-errors'
import { transformDateOfBirthErrors } from '@utils/simplified-account/format/transform-date-of-birth-errors'

export interface ResponsiblePersonPersonalDetailsBody {
  firstName: string
  lastName: string
  dobDay: string
  dobMonth: string
  dobYear: string
}

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

async function post(req: ServiceRequest<ResponsiblePersonPersonalDetailsBody>, res: ServiceResponse) {
  const { account } = req
  const switchingCredentialId = account.getSwitchingCredential().externalId
  const currentSession = ResponsiblePersonSession.extract(req)

  for (const validation of ADYEN_RESPONSIBLE_PERSON_PERSONAL_DETAILS_VALIDATIONS) {
    await validation.run(req)
  }

  const errors = validationResult(req).formatWith(transformDateOfBirthErrors)

  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors)
    // console.log(errors)

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
