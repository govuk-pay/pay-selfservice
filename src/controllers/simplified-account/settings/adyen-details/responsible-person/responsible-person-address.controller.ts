import type { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { response } from '@utils/response'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { FROM_REVIEW_QUERY_PARAM, ResponsiblePersonSession } from './constants'
import { validationResult } from 'express-validator'
import { formatValidationErrors } from '@utils/simplified-account/format'
import { ADYEN_RESPONSIBLE_PERSON_ADDRESS_VALIDATIONS } from '@utils/simplified-account/validation/adyen/adyen-responsible-person-address.schema'

function getBackLink(req: ServiceRequest<unknown>) {
  const switchingCredentialId = req.account.getSwitchingCredential().externalId
  const backPath =
    req.query[FROM_REVIEW_QUERY_PARAM] === 'true'
      ? paths.simplifiedAccount.settings.adyenDetails.responsiblePerson.checkYourAnswers
      : paths.simplifiedAccount.settings.adyenDetails.responsiblePerson.index

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

  const address = {
    addressLine1: currentSession.addressLine1 ?? '',
    addressLine2: currentSession.addressLine2 ?? '',
    addressCity: currentSession.addressCity ?? '',
    addressPostcode: currentSession.addressPostcode ?? '',
  }

  return response(req, res, 'simplified-account/settings/adyen-details/responsible-person/address', {
    backLink: getBackLink(req),
    address,
  })
}

interface ResponsiblePersonAddressBody {
  addressLine1: string
  addressLine2: string
  addressCity: string
  addressPostcode: string
}

async function post(req: ServiceRequest<ResponsiblePersonAddressBody>, res: ServiceResponse) {
  const { account } = req
  const switchingCredentialId = account.getSwitchingCredential().externalId
  const currentSession = ResponsiblePersonSession.extract(req)

  for (const validation of ADYEN_RESPONSIBLE_PERSON_ADDRESS_VALIDATIONS) {
    await validation.run(req)
  }
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors)

    return response(req, res, 'simplified-account/settings/adyen-details/responsible-person/address', {
      errors: {
        summary: formattedErrors.errorSummary,
        formErrors: formattedErrors.formErrors,
      },
      address: {
        addressLine1: req.body.addressLine1,
        addressLine2: req.body.addressLine2,
        addressCity: req.body.addressCity,
        addressPostcode: req.body.addressPostcode,
      },
      backLink: getBackLink(req),
    })
  }

  ResponsiblePersonSession.set(req, currentSession, {
    addressLine1: req.body.addressLine1,
    addressLine2: req.body.addressLine2,
    addressCity: req.body.addressCity,
    addressPostcode: req.body.addressPostcode,
  } as ResponsiblePersonSession)

  return res.redirect(
    formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.adyenDetails.responsiblePerson.contactDetails,
      req.service.externalId,
      req.account.type,
      switchingCredentialId
    )
  )
}

export { get, post }
