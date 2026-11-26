export type AdyenAccountSetupTaskNameData =
  'organisation_details' | 'legal_terms' | 'size_of_organisation' | 'bank_details' | 'responsible_person' | 'director'

export interface AdyenAccountSetupData {
  service_id: string
  credential_external_id: string
  tasks: Record<AdyenAccountSetupTaskNameData, AdyenAccountSetupTaskData>
}

export interface AdyenAccountSetupTaskData {
  status: AdyenAccountSetupTaskStatus
}

type AdyenAccountSetupTaskStatus = 'COMPLETED' | 'NOT_STARTED'
