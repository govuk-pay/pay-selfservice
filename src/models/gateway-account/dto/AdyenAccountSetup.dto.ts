export type AdyenAccountSetupTaskNameData =
  | 'organisation_details'
  | 'legal_terms'
  | 'bank_details'
  | 'responsible_person'
  | 'director'
  | 'reason_for_taking_payments'

export interface AdyenAccountSetupData {
  service_id: string
  credential_external_id: string
  tasks: Record<AdyenAccountSetupTaskNameData, AdyenAccountSetupTaskData>
}

export interface AdyenAccountSetupTaskData {
  status: AdyenAccountSetupTaskStatus
}

type AdyenAccountSetupTaskStatus = 'COMPLETED' | 'NOT_STARTED'
