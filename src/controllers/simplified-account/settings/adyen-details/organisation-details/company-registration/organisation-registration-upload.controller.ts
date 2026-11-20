import { response } from '@utils/response'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import type { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { CompanyRegistrationBody, OrganisationDetailsSession } from '../constants'
import createLogger from '@utils/logger'
import { NextFunction } from 'express'
import policyBucket from '@controllers/policy/aws-s3-policy-bucket'
import supportedPolicyDocuments from '@controllers/policy/supported-policy-documents'
import { check, validationResult } from 'express-validator'
import { GOV_ENTITY_DOC_FORM_FIELD_NAME } from '@controllers/simplified-account/settings/stripe-details/government-entity-document/constants'
import formatValidationErrors from '@utils/simplified-account/format/format-validation-errors'
import { submitOrganisationDetails } from './utils'

const logger = createLogger(__filename)

async function get(req: ServiceRequest, res: ServiceResponse, next: NextFunction) {
  const { account } = req
  const switchingCredentialId = account.getSwitchingCredential().externalId
  const currentSession = OrganisationDetailsSession.extract(req)
  const key = 'public-sector-entity-confirmation'

  try {
    const documentConfig: unknown = await supportedPolicyDocuments.lookup(key)
    const downloadLink = await policyBucket.generatePrivateLink(documentConfig)

    logger.info(`Generated link to download document - ${key}`)

    if (currentSession.isEmpty()) {
      return res.redirect(
        formatServiceAndAccountPathsFor(
          paths.simplifiedAccount.settings.switchPsp.switchToAdyen.index,
          req.service.externalId,
          req.account.type
        )
      )
    }

    return response(
      req,
      res,
      'simplified-account/settings/adyen-details/company-registration/organisation-registration-upload',
      {
        hasCompanyRegistrationNumber: currentSession.hasCompanyRegistrationNumber ?? '',
        backLink: formatServiceAndAccountPathsFor(
          paths.simplifiedAccount.settings.adyenDetails.organisationDetails.hasCompanyRegistration,
          req.service.externalId,
          req.account.type,
          switchingCredentialId
        ),
        downloadLink,
        uploadField: GOV_ENTITY_DOC_FORM_FIELD_NAME,
      }
    )
  } catch (err) {
    next(err)
  }
}

async function post(req: ServiceRequest<CompanyRegistrationBody>, res: ServiceResponse) {
  const { account, file } = req
  const switchingCredentialId = account.getSwitchingCredential().externalId
  const existingSession = OrganisationDetailsSession.extract(req)

  const completeSession = new OrganisationDetailsSession({
    ...existingSession,
    companyRegistrationNumber: req.body.companyRegistrationNumber,
  })

  OrganisationDetailsSession.set(req, completeSession)

  const validations = [
    check(GOV_ENTITY_DOC_FORM_FIELD_NAME).custom(() => {
      if (!file) {
        throw new Error('Select a file to upload')
      }
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        throw new Error('File size must be less than 10MB')
      }
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
      if (!allowedTypes.includes(file.mimetype)) {
        throw new Error('File type must be PDF, JPG or PNG')
      }
      return true
    }),
  ]

  await Promise.all(validations.map((validation) => validation.run(req)))
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors)

    return response(
      req,
      res,
      'simplified-account/settings/adyen-details/company-registration/organisation-registration-upload',
      {
        errors: {
          summary: formattedErrors.errorSummary,
          formErrors: formattedErrors.formErrors,
        },
        backLink: formatServiceAndAccountPathsFor(
          paths.simplifiedAccount.settings.adyenDetails.organisationDetails.hasCompanyRegistration,
          req.service.externalId,
          req.account.type,
          switchingCredentialId
        ),
        uploadField: GOV_ENTITY_DOC_FORM_FIELD_NAME
      }
    )
  }

  const encodedDocument = file!.buffer.toString('base64')

  await submitOrganisationDetails(
    req.service,
    req.account,
    req.user.externalId,
    completeSession,
    switchingCredentialId,
    encodedDocument
  )

  OrganisationDetailsSession.clear(req)

  return res.redirect(
    formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.switchPsp.switchToAdyen.index,
      req.service.externalId,
      req.account.type,
      switchingCredentialId
    )
  )
}

export { get, post }
