type Operation = 'replace'

export interface Update {
  op: Operation
  path: string
  value: string
}

export default class GatewayAccountCredentialUpdateRequest {
  public updates: Update[]

  constructor(userExternalId: string) {
    this.updates = [
      {
        op: 'replace',
        path: 'last_updated_by_user_external_id',
        value: userExternalId,
      },
    ]
  }

  replace() {
    return safeOperation('replace', this)
  }

  formatPayload() {
    return this.updates
  }
}

const safeOperation = (op: Operation, request: GatewayAccountCredentialUpdateRequest) => {
  return {
    credentials: () => {
      return {
        oneOffCustomerInitiated: (value: string) => {
          request.updates.push({ op, path: 'credentials/worldpay/one_off_customer_initiated', value })
          return request
        },
        recurringCustomerInitiated: (value: string) => {
          request.updates.push({ op, path: 'credentials/worldpay/recurring_customer_initiated', value })
          return request
        },
        recurringMerchantInitiated: (value: string) => {
          request.updates.push({ op, path: 'credentials/worldpay/recurring_merchant_initiated', value })
          return request
        },
        googlePayMerchantId: (value: string) => {
          request.updates.push({ op, path: 'credentials/gateway_merchant_id', value })
          return request
        },
      }
    },
    state: (value: string) => {
      request.updates.push({ op, path: 'state', value })
      return request
    },
  }
}
