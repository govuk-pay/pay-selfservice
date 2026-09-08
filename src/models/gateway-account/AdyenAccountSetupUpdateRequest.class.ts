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
      bankAccount: (value: AdyenAccountSetupTaskStatus) => {
        return this.#op('replace', 'bank_account', value)
      },

      responsiblePerson: (value: AdyenAccountSetupTaskStatus) => {
        return this.#op('replace', 'responsible_person', value)
      },

      vatNumber: (value: AdyenAccountSetupTaskStatus) => {
        return this.#op('replace', 'vat_number', value)
      },

      companyNumber: (value: AdyenAccountSetupTaskStatus) => {
        return this.#op('replace', 'company_number', value)
      },

      director: (value: AdyenAccountSetupTaskStatus) => {
        return this.#op('replace', 'director', value)
      },

      governmentEntityDocument: (value: AdyenAccountSetupTaskStatus) => {
        return this.#op('replace', 'government_entity_document', value)
      },

      organisationDetails: (value: AdyenAccountSetupTaskStatus) => {
        return this.#op('replace', 'organisation_details', value)
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
