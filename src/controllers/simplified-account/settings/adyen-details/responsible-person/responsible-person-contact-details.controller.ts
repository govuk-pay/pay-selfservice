import type { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { response } from '@utils/response'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { FROM_REVIEW_QUERY_PARAM, ResponsiblePersonSession } from './constants'
import { validationResult } from 'express-validator'
import { formatValidationErrors } from '@utils/simplified-account/format'
import { ADYEN_RESPONSIBLE_PERSON_CONTACT_DETAILS_VALIDATIONS } from '@utils/simplified-account/validation/adyen/adyen-responsible-person-contact-details.schema'

function getBackLink(req: ServiceRequest<unknown>) {
  const switchingCredentialId = req.account.getSwitchingCredential().externalId
  const backPath =
    req.query[FROM_REVIEW_QUERY_PARAM] === 'true'
      ? paths.simplifiedAccount.settings.adyenDetails.responsiblePerson.checkYourAnswers
      : paths.simplifiedAccount.settings.adyenDetails.responsiblePerson.address

  return formatServiceAndAccountPathsFor(backPath, req.service.externalId, req.account.type, switchingCredentialId)
}

function get(req: ServiceRequest, res: ServiceResponse) {
  const currentSession = ResponsiblePersonSession.extract(req)
  if (currentSession.isEmpty()) {
    return res.redirect(
      formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.switchPsp.switchToAdyen.index,
        req.service.externalId,
        req.account.type
      )
    )
  }

  const contact = {
    telephoneNumber: currentSession.telephoneNumber ?? '',
    email: currentSession.email ?? '',
  }

  return response(req, res, 'simplified-account/settings/adyen-details/responsible-person/contact-details', {
    backLink: getBackLink(req),
    contact,
  })
}

interface ResponsiblePersonContactDetailsBody {
  telephoneNumber: string
  email: string
}

async function post(req: ServiceRequest<ResponsiblePersonContactDetailsBody>, res: ServiceResponse) {
  const { account } = req
  const switchingCredentialId = account.getSwitchingCredential().externalId
  const currentSession = ResponsiblePersonSession.extract(req)

  for (const validation of ADYEN_RESPONSIBLE_PERSON_CONTACT_DETAILS_VALIDATIONS) {
    await validation.run(req)
  }
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors)

    return response(req, res, 'simplified-account/settings/adyen-details/responsible-person/contact-details', {
      errors: {
        summary: formattedErrors.errorSummary,
        formErrors: formattedErrors.formErrors,
      },
      contact: {
        telephoneNumber: req.body.telephoneNumber,
        email: req.body.email,
      },
      backLink: getBackLink(req),
    })
  }

  ResponsiblePersonSession.set(req, currentSession, {
    telephoneNumber: req.body.telephoneNumber,
    email: req.body.email,
  } as ResponsiblePersonSession)

  return res.redirect(
    formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.adyenDetails.responsiblePerson.checkYourAnswers,
      req.service.externalId,
      req.account.type,
      switchingCredentialId
    )
  )
}

export { get, post }
