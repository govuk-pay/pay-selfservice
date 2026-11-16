import { PaymentProvider } from '@models/constants/payment-provider'
import {
  createOrganisation,
  createStore,
  getStoreDetailsForStripeMigration,
  setAdyenStoreId,
} from '@services/adyen-details.service'
import { ServiceRequest } from '@utils/types/express'
import { CompanyRegistrationBody, OrganisationDetailsSession } from '../constants'
import { markTaskAsComplete } from '@services/adyen-setup.service'

export const submitOrganisationDetails = async (
  req: ServiceRequest<CompanyRegistrationBody>,
  session: OrganisationDetailsSession,
  switchingCredentialId: string
) => {
  const storeDetails =
    req.account.paymentProvider === PaymentProvider.STRIPE ? await getStoreDetailsForStripeMigration(req) : undefined

  if (!storeDetails) {
    throw new Error(`Merchant details not returned from Stripe for [service_external_id: ${req.service.externalId}]`)
  }

  const { businessLine, balanceAccount } = await createOrganisation(
    session,
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
    organisationDetails: session,
  })

  await setAdyenStoreId(req.service.externalId, req.account.type, switchingCredentialId, req.user.externalId, store.id!)
  await markTaskAsComplete(req.service.externalId, req.account.type, switchingCredentialId, 'organisationDetails')
}
