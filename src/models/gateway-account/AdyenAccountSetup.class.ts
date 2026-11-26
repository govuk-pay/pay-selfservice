import { AdyenAccountSetupData } from '@models/gateway-account/dto/AdyenAccountSetup.dto'

export class AdyenAccountSetup {
  readonly serviceExternalId: string
  readonly credentialExternalId: string
  readonly tasks: Record<AdyenAccountSetupTaskName, AdyenAccountSetupTask>

  constructor(data: AdyenAccountSetupData) {
    this.serviceExternalId = data.service_id
    this.credentialExternalId = data.credential_external_id
    this.tasks = {
      organisationDetails: data.tasks.organisation_details,
      legalTerms: data.tasks.legal_terms,
      sizeOfOrganisation: data.tasks.size_of_organisation,
      bankDetails: data.tasks.bank_details,
      responsiblePerson: data.tasks.responsible_person,
      director: data.tasks.director,
    }
  }
}

export interface AdyenAccountSetupTask {
  status: AdyenAccountSetupTaskStatus
}

export const AdyenAccountSetupTaskStatus = {
  COMPLETED: 'COMPLETED' as AdyenAccountSetupTaskStatus,
  NOT_STARTED: 'NOT_STARTED' as AdyenAccountSetupTaskStatus,
} as const

export type AdyenAccountSetupTaskStatus = 'COMPLETED' | 'NOT_STARTED'
export type AdyenAccountSetupTaskName =
  'organisationDetails' | 'legalTerms' | 'sizeOfOrganisation' | 'bankDetails' | 'responsiblePerson' | 'director'
