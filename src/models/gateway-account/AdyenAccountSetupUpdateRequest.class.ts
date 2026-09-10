import { AdyenAccountSetupTaskName, AdyenAccountSetupTaskStatus } from '@models/gateway-account/AdyenAccountSetup.class'
import { AdyenAccountSetupUpdate } from '@models/gateway-account/dto/AdyenAccountSetupUpdate.dto'
import { AdyenAccountSetupTaskNameData } from '@models/gateway-account/dto/AdyenAccountSetup.dto'

export class AdyenAccountSetupUpdateRequest {
  private readonly updates: AdyenAccountSetupUpdate[]

  constructor() {
    this.updates = []
  }

  toJson(): AdyenAccountSetupUpdate[] {
    return this.updates
  }

  replace(): Record<AdyenAccountSetupTaskName, (value: AdyenAccountSetupTaskStatus) => this> {
    return {
      organisationDetails: (value: AdyenAccountSetupTaskStatus) => {
        return this.#op('replace', 'organisation_details', value)
      },

      legalTerms: (value: AdyenAccountSetupTaskStatus) => {
        return this.#op('replace', 'legal_terms', value)
      },

      bankDetails: (value: AdyenAccountSetupTaskStatus) => {
        return this.#op('replace', 'bank_details', value)
      },

      responsiblePerson: (value: AdyenAccountSetupTaskStatus) => {
        return this.#op('replace', 'responsible_person', value)
      },

      director: (value: AdyenAccountSetupTaskStatus) => {
        return this.#op('replace', 'director', value)
      },

      reasonForTakingPayments: (value: AdyenAccountSetupTaskStatus) => {
        return this.#op('replace', 'reason_for_taking_payments', value)
      },
    }
  }

  #op(op: 'replace', path: AdyenAccountSetupTaskNameData, value: AdyenAccountSetupTaskStatus) {
    this.updates.push({
      op,
      path,
      value,
    })
    return this
  }
}
