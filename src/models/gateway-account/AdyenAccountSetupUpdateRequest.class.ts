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
      organisationDetails: (value) => {
        return this.#op('replace', 'organisation_details', value)
      },

      legalTerms: (value) => {
        return this.#op('replace', 'legal_terms', value)
      },

      sizeOfOrganisation: (value) => {
        return this.#op('replace', 'size_of_organisation', value)
      },

      bankDetails: (value) => {
        return this.#op('replace', 'bank_details', value)
      },

      responsiblePerson: (value) => {
        return this.#op('replace', 'responsible_person', value)
      },

      director: (value) => {
        return this.#op('replace', 'director', value)
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
