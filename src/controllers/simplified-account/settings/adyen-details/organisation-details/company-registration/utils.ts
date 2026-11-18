import { PaymentProvider } from '@models/constants/payment-provider'
import { createOrganisation, createStore, setAdyenStoreId, uploadRegistrationDocument } from '@services/adyen-details.service'
import { OrganisationDetailsSession } from '../constants'
import { markTaskAsComplete } from '@services/adyen-setup.service'
import Service from '@models/service/Service.class'
import GatewayAccount from '@models/gateway-account/GatewayAccount.class'
import { getStripeStatementDescriptor } from '@services/stripe-details.service'
import { nonEmpty } from '@utils/types/non-empty-string'

export const submitOrganisationDetails = async (
  service: Service,
  account: GatewayAccount,
  userExternalId: string,
  session: OrganisationDetailsSession,
  switchingCredentialId: string,
  encodedDocument?: string
) => {
  const telephoneNumber = service.merchantDetails?.telephoneNumber

  const storeDetails =
    account.paymentProvider === PaymentProvider.STRIPE && telephoneNumber
      ? {
        statementDescriptor: await getStripeStatementDescriptor(account),
        telephoneNumber,
      }
      : undefined

  if (!storeDetails) {
    throw new Error(`Merchant details not returned from Stripe for [service_external_id: ${service.externalId}]`)
  }

  const { businessLine, balanceAccount, legalEntity } = await createOrganisation(
    session,
    service,
    account.type,
    switchingCredentialId,
    userExternalId
  )

  const store = await createStore({
    ...storeDetails,
    businessLineId: businessLine.id,
    balanceAccountId: balanceAccount.id,
    serviceName: service.name,
    organisationDetails: session,
  })

  if (nonEmpty(encodedDocument)) {
    await uploadRegistrationDocument(legalEntity.id, service.name, encodedDocument!)
  }

  await setAdyenStoreId(service.externalId, account.type, switchingCredentialId, userExternalId, store.id!)
  await markTaskAsComplete(service.externalId, account.type, switchingCredentialId, 'organisationDetails')
}
