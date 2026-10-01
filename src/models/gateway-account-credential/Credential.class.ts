import { CredentialData } from '@models/gateway-account-credential/dto/Credential.dto'
import WorldpayCredential from '@models/gateway-account-credential/WorldpayCredential.class'

class Credential {
  public stripeAccountId?: string
  public oneOffCustomerInitiated?: WorldpayCredential
  public recurringCustomerInitiated?: WorldpayCredential
  public recurringMerchantInitiated?: WorldpayCredential
  public googlePayMerchantId?: string
  public legalEntityId?: string
  public storeId?: string
  public accountHolderId?: string
  public balanceAccountId?: string
  public rawResponse?: CredentialData

  withStripeAccountId(stripeAccountId: string) {
    this.stripeAccountId = stripeAccountId
    return this
  }

  withOneOffCustomerInitiated(oneOffCustomerInitiated: WorldpayCredential) {
    this.oneOffCustomerInitiated = oneOffCustomerInitiated
    return this
  }

  withRecurringCustomerInitiated(recurringCustomerInitiated: WorldpayCredential) {
    this.recurringCustomerInitiated = recurringCustomerInitiated
    return this
  }

  withRecurringMerchantInitiated(recurringMerchantInitiated: WorldpayCredential) {
    this.recurringMerchantInitiated = recurringMerchantInitiated
    return this
  }

  withGooglePayMerchantId(googlePayMerchantId: string) {
    this.googlePayMerchantId = googlePayMerchantId
    return this
  }

  withLegalEntityId(legalEntityId: string) {
    this.legalEntityId = legalEntityId
    return this
  }

  withStoreId(storeId: string) {
    this.storeId = storeId
    return this
  }

  withAccountHolderId(accountHolderId: string) {
    this.accountHolderId = accountHolderId
    return this
  }

  withBalanceAccountId(balanceAccountId: string) {
    this.balanceAccountId = balanceAccountId
    return this
  }

  /** @deprecated this is a temporary compatability fix! If you find yourself using this for new code
   * you should instead add any rawResponse data as part of the constructor */
  withRawResponse(data: CredentialData) {
    this.rawResponse = data
    return this
  }

  static fromJson(data: CredentialData) {
    const credential = new Credential().withRawResponse(data)
    if (data?.stripe_account_id) {
      credential.withStripeAccountId(data.stripe_account_id)
    }
    if (data?.one_off_customer_initiated) {
      credential.withOneOffCustomerInitiated(WorldpayCredential.fromJson(data.one_off_customer_initiated))
    }
    if (data?.recurring_customer_initiated) {
      credential.withRecurringCustomerInitiated(WorldpayCredential.fromJson(data.recurring_customer_initiated))
    }
    if (data?.recurring_merchant_initiated) {
      credential.withRecurringMerchantInitiated(WorldpayCredential.fromJson(data.recurring_merchant_initiated))
    }
    if (data?.gateway_merchant_id) {
      credential.withGooglePayMerchantId(data.gateway_merchant_id)
    }
    if (data?.legal_entity_id) {
      credential.withLegalEntityId(data.legal_entity_id)
    }
    if (data?.store_id) {
      credential.withStoreId(data.store_id)
    }
    if (data?.account_holder_id) {
      credential.withAccountHolderId(data.account_holder_id)
    }
    if (data?.balance_account_id) {
      credential.withBalanceAccountId(data.balance_account_id)
    }
    return credential
  }
}

export = Credential
