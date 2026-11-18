import type { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { response } from '@utils/response'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { markTaskAsComplete } from '@services/adyen-setup.service'
import { createBankDetails } from '@services/adyen-details.service'
import { validationResult } from 'express-validator'
import { formatValidationErrors } from '@utils/simplified-account/format'
import { ADYEN_BANK_DETAILS_VALIDATIONS } from '@utils/simplified-account/validation/adyen/adyen-bank-details.schema'

function get(req: ServiceRequest, res: ServiceResponse) {
  return response(req, res, 'simplified-account/settings/adyen-details/bank-details', {
    backLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.switchPsp.switchToAdyen.index,
      req.service.externalId,
      req.account.type
    ),
  })
}

export interface CreateBankDetailsBody {
  sortCode: string
  accountNumber: string
}

async function post(req: ServiceRequest<CreateBankDetailsBody>, res: ServiceResponse) {
  const { account } = req
  const switchingCredentialId = account.getSwitchingCredential().externalId

  for (const validation of ADYEN_BANK_DETAILS_VALIDATIONS) {
    await validation.run(req)
  }
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors)

    return response(req, res, 'simplified-account/settings/adyen-details/bank-details', {
      errors: {
        summary: formattedErrors.errorSummary,
        formErrors: formattedErrors.formErrors,
      },
      sortCode: req.body.sortCode,
      accountNumber: req.body.accountNumber,
      backLink: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.switchPsp.switchToAdyen.index,
        req.service.externalId,
        req.account.type
      ),
    })
  }

  await createBankDetails(req.body, req.service.externalId, req.account.type, switchingCredentialId)
  await markTaskAsComplete(req.service.externalId, req.account.type, switchingCredentialId, 'bankDetails')

  return res.redirect(
    formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.switchPsp.switchToAdyen.index,
      req.service.externalId,
      req.account.type
    )
  )
}

export { get, post }
