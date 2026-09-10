import {
  AdyenAccountSetup,
  AdyenAccountSetupTaskName,
  AdyenAccountSetupTaskStatus,
} from '@models/gateway-account/AdyenAccountSetup.class'
import { AdyenAccountSetupData, AdyenAccountSetupTaskData } from '@models/gateway-account/dto/AdyenAccountSetup.dto'

export class AdyenAccountSetupFixture {
  readonly serviceExternalId: string
  readonly credentialExternalId: string
  readonly tasks: Record<AdyenAccountSetupTaskName, AdyenAccountSetupTaskFixture>

  constructor(...overrides: Partial<AdyenAccountSetupFixture>[]) {
    this.serviceExternalId = 'service-external-id-123-abc'
    this.credentialExternalId = 'gateway-account-credential-abc-123'
    this.tasks = {
      organisationDetails: AdyenAccountSetupTaskFixture.NotStarted(),
      legalTerms: AdyenAccountSetupTaskFixture.NotStarted(),
      bankDetails: AdyenAccountSetupTaskFixture.NotStarted(),
      responsiblePerson: AdyenAccountSetupTaskFixture.NotStarted(),
      director: AdyenAccountSetupTaskFixture.NotStarted(),
      reasonForTakingPayments: AdyenAccountSetupTaskFixture.NotStarted(),
    }

    overrides.forEach((override) => {
      Object.assign(this, override)
    })
  }

  static NotStarted(...overrides: Partial<AdyenAccountSetupFixture>[]) {
    return new AdyenAccountSetupFixture(...overrides)
  }

  static Completed(...overrides: Partial<AdyenAccountSetupFixture>[]) {
    return new AdyenAccountSetupFixture(
      {
        tasks: {
          organisationDetails: AdyenAccountSetupTaskFixture.Completed(),
          legalTerms: AdyenAccountSetupTaskFixture.Completed(),
          bankDetails: AdyenAccountSetupTaskFixture.Completed(),
          responsiblePerson: AdyenAccountSetupTaskFixture.Completed(),
          director: AdyenAccountSetupTaskFixture.Completed(),
          reasonForTakingPayments: AdyenAccountSetupTaskFixture.Completed(),
        },
      },
      ...overrides
    )
  }

  toAdyenAccountSetupData(): AdyenAccountSetupData {
    return {
      service_id: this.serviceExternalId,
      credential_external_id: this.credentialExternalId,
      tasks: {
        organisation_details: this.tasks.organisationDetails.toTaskData(),
        legal_terms: this.tasks.legalTerms.toTaskData(),
        bank_details: this.tasks.bankDetails.toTaskData(),
        responsible_person: this.tasks.responsiblePerson.toTaskData(),
        director: this.tasks.director.toTaskData(),
        reason_for_taking_payments: this.tasks.reasonForTakingPayments.toTaskData(),
      },
    }
  }

  toAdyenAccountSetup(): AdyenAccountSetup {
    return new AdyenAccountSetup(this.toAdyenAccountSetupData())
  }
}

export class AdyenAccountSetupTaskFixture {
  readonly status: AdyenAccountSetupTaskStatus

  constructor(...overrides: Partial<AdyenAccountSetupTaskFixture>[]) {
    this.status = AdyenAccountSetupTaskStatus.NOT_STARTED
    overrides.forEach((override) => {
      Object.assign(this, override)
    })
  }

  static NotStarted(...overrides: Partial<AdyenAccountSetupTaskFixture>[]) {
    return new AdyenAccountSetupTaskFixture(...overrides)
  }

  static Completed(...overrides: Partial<AdyenAccountSetupTaskFixture>[]) {
    return new AdyenAccountSetupTaskFixture({ status: AdyenAccountSetupTaskStatus.COMPLETED }, ...overrides)
  }

  toTaskData(): AdyenAccountSetupTaskData {
    return {
      status: this.status,
    }
  }
}
