import { response } from '@utils/response'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import type { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { CompanyRegistrationBody, OrganisationDetailsSession } from '../constants'
import createLogger from '@utils/logger'
import { NextFunction } from 'express'
import policyBucket from '@controllers/policy/aws-s3-policy-bucket'
import supportedPolicyDocuments from '@controllers/policy/supported-policy-documents'

const logger = createLogger(__filename)

export async function get(req: ServiceRequest, res: ServiceResponse, next: NextFunction) {
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
        downloadLink
      },
    )
  } catch (err) {
    next(err)
  }
}

export function post(req: ServiceRequest<CompanyRegistrationBody>, res: ServiceResponse) {
  const { account } = req
  const switchingCredentialId = account.getSwitchingCredential().externalId

  return res.redirect(
    formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.switchPsp.switchToAdyen.index,
      req.service.externalId,
      req.account.type,
      switchingCredentialId
    )
  )
}
