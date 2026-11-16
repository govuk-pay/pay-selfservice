import { response } from '@utils/response'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import type { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { CompanyRegistrationBody, OrganisationDetailsSession } from '../constants'
import { createOrganisation, createStore, setAdyenStoreId } from '@services/adyen-details.service'
import { PaymentProvider } from '@models/constants/payment-provider'
import { markTaskAsComplete } from '@services/adyen-setup.service'
import { InvalidConfigurationError } from '@root/errors'
import { getStripeStatementDescriptor } from '@services/stripe-details.service'

async function getStoreDetailsForStripeMigration(req: ServiceRequest<CompanyRegistrationBody>) {
  const telephoneNumber = req.service.merchantDetails?.telephoneNumber

  if (!telephoneNumber) {
    throw new InvalidConfigurationError(
      `No telephone number set in merchant details [service_external_id: ${req.service.externalId}]`
    )
  }

  const statementDescriptor = await getStripeStatementDescriptor(req.account)

  return { telephoneNumber, statementDescriptor }
}

function get(req: ServiceRequest, res: ServiceResponse) {
  const { account } = req
  const switchingCredentialId = account.getSwitchingCredential().externalId
  const currentSession = OrganisationDetailsSession.extract(req)

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
    'simplified-account/settings/adyen-details/company-registration/company-registration-number',
    {
      companyRegistrationNumber: currentSession.companyRegistrationNumber ?? '',
      backLink: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.adyenDetails.organisationDetails.hasCompanyRegistration,
        req.service.externalId,
        req.account.type,
        switchingCredentialId
      ),
    }
  )
}

async function post(req: ServiceRequest<CompanyRegistrationBody>, res: ServiceResponse) {
  const { account } = req
  const switchingCredentialId = account.getSwitchingCredential().externalId
  const existingSession = OrganisationDetailsSession.extract(req)

  const completeSession = new OrganisationDetailsSession({
    ...existingSession,
    companyRegistrationNumber: req.body.companyRegistrationNumber,
  })

  OrganisationDetailsSession.set(req, completeSession)

  const storeDetails =
    req.account.paymentProvider === PaymentProvider.STRIPE ? await getStoreDetailsForStripeMigration(req) : undefined

  if (!storeDetails) {
    throw new Error(`Merchant details not returned from Stripe for [service_external_id: ${req.service.externalId}]`)
  }

  const { businessLine, balanceAccount } = await createOrganisation(
    completeSession,
    req.service,
    req.account.type,
    switchingCredentialId,
    req.user.externalId
  )

  const store = await createStore({
    ...storeDetails,
    businessLineId: businessLine.id,
    balanceAccountId: balanceAccount.id,
    serviceName: req.service.name,
    organisationDetails: completeSession,
  })

  await setAdyenStoreId(req.service.externalId, req.account.type, switchingCredentialId, req.user.externalId, store.id!)
  await markTaskAsComplete(req.service.externalId, req.account.type, switchingCredentialId, 'organisationDetails')

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
