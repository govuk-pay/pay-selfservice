import type { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { response } from '@utils/response'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { createFinanceOrgDetails } from '@services/adyen-details.service'

function get(req: ServiceRequest, res: ServiceResponse) {
  return response(req, res, 'simplified-account/settings/adyen-details/finance-org-details', {
    backLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.switchPsp.switchToAdyen.index,
      req.service.externalId,
      req.account.type
    ),
  })
}

interface FinanceOrgDetailsBody {
  annualTurnover: string
  employeeCount: string
  financeDay: string
  financeMonth: string
  financeYear: string
}

async function post(req: ServiceRequest<FinanceOrgDetailsBody>, res: ServiceResponse) {
  const { account } = req
  const switchingCredential = account.getSwitchingCredential()
  const organisationLegalEntityId = switchingCredential.credentials.legalEntityId

  if (!organisationLegalEntityId) {
    throw new Error('Cannot add finance org details: no Adyen legal entity ID on the switching credential')
  }

  await createFinanceOrgDetails(
    {
      annualTurnover: req.body.annualTurnover,
      employeeCount: req.body.employeeCount,
      financeDay: req.body.financeDay,
      financeMonth: req.body.financeMonth,
      financeYear: req.body.financeYear,
    },
    organisationLegalEntityId
  )

  return res.redirect(
    formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.switchPsp.switchToAdyen.index,
      req.service.externalId,
      req.account.type
    )
  )
}

export { get, post }
