import type { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { response } from '@utils/response'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { FROM_REVIEW_QUERY_PARAM, ServiceDirectorSession } from './constants'
import { validationResult } from 'express-validator'
import { formatValidationErrors } from '@utils/simplified-account/format'
import { transformDateOfBirthErrors } from '@utils/simplified-account/format/transform-date-of-birth-errors'
import { ADYEN_SERVICE_DIRECTOR_DETAILS_VALIDATIONS } from '@utils/simplified-account/validation/adyen/adyen-service-director-details.schema'

function getBackLink(req: ServiceRequest<unknown>) {
  const switchingCredentialId = req.account.getSwitchingCredential().externalId
  const backPath =
    req.query[FROM_REVIEW_QUERY_PARAM] === 'true'
      ? paths.simplifiedAccount.settings.adyenDetails.serviceDirector.checkYourAnswers
      : paths.simplifiedAccount.settings.switchPsp.switchToAdyen.index

  return formatServiceAndAccountPathsFor(backPath, req.service.externalId, req.account.type, switchingCredentialId)
}

function get(req: ServiceRequest, res: ServiceResponse) {
  const currentSession = ServiceDirectorSession.extract(req)

  const name = {
    firstName: currentSession.firstName ?? '',
    lastName: currentSession.lastName ?? '',
  }

  const dob = {
    dobDay: currentSession.dobDay ?? '',
    dobMonth: currentSession.dobMonth ?? '',
    dobYear: currentSession.dobYear ?? '',
  }

  const backLink = getBackLink(req)

  return response(req, res, 'simplified-account/settings/adyen-details/service-director/details', {
    backLink,
    name,
    dob,
    email: currentSession.email ?? '',
  })
}

interface ServiceDirectorDetailsBody {
  firstName: string
  lastName: string
  dobDay: string
  dobMonth: string
  dobYear: string
  email: string
}

async function post(req: ServiceRequest<ServiceDirectorDetailsBody>, res: ServiceResponse) {
  const { account } = req
  const switchingCredentialId = account.getSwitchingCredential().externalId
  const currentSession = ServiceDirectorSession.extract(req)

  for (const validation of ADYEN_SERVICE_DIRECTOR_DETAILS_VALIDATIONS) {
    await validation.run(req)
  }
  const errors = validationResult(req).formatWith(transformDateOfBirthErrors)

  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors)
    const backLink = getBackLink(req)

    return response(req, res, 'simplified-account/settings/adyen-details/service-director/details', {
      errors: {
        summary: formattedErrors.errorSummary,
        formErrors: formattedErrors.formErrors,
      },
      backLink,
      name: {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
      },
      dob: {
        dobDay: req.body.dobDay,
        dobMonth: req.body.dobMonth,
        dobYear: req.body.dobYear,
      },
      email: req.body.email,
    })
  }

  ServiceDirectorSession.set(req, currentSession, {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    dobDay: req.body.dobDay,
    dobMonth: req.body.dobMonth,
    dobYear: req.body.dobYear,
    email: req.body.email,
  } as ServiceDirectorSession)

  return res.redirect(
    formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.adyenDetails.serviceDirector.address,
      req.service.externalId,
      req.account.type,
      switchingCredentialId
    )
  )
}

export { get, post }
