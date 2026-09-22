import { AdyenTaskIdentifier } from '@models/task-workflows/task-identifiers/adyen-task-identifiers'
import { AdyenAccountSetupTaskName } from '@models/gateway-account/AdyenAccountSetup.class'
import paths from '@root/paths'

interface AdyenTaskDefinition {
  linkText: string
  id: AdyenTaskIdentifier
  taskKey: AdyenAccountSetupTaskName
  path: string
}

const ORGANISATION_DETAILS_TASK: AdyenTaskDefinition = {
  linkText: 'Organisation details',
  id: AdyenTaskIdentifier.ORG_DETAILS,
  taskKey: 'organisationDetails',
  path: paths.simplifiedAccount.settings.adyenDetails.organisationDetails.index,
}

const LEGAL_TERMS_TASK: AdyenTaskDefinition = {
  linkText: 'Read and accept Adyen’s legal terms',
  id: AdyenTaskIdentifier.LEGAL_TERMS,
  taskKey: 'legalTerms',
  path: paths.simplifiedAccount.settings.adyenDetails.legalTerms,
}

const ORGANISATION_DETAILS_GROUP_TASKS: AdyenTaskDefinition[] = [
  {
    linkText: 'Organisation’s bank details',
    id: AdyenTaskIdentifier.BANK_DETAILS,
    taskKey: 'bankDetails',
    path: paths.simplifiedAccount.settings.adyenDetails.bankDetails,
  },
  {
    linkText: 'Responsible person',
    id: AdyenTaskIdentifier.RESPONSIBLE_PERSON,
    taskKey: 'responsiblePerson',
    path: paths.simplifiedAccount.settings.adyenDetails.responsiblePerson.index,
  },
  {
    linkText: 'Service director',
    id: AdyenTaskIdentifier.SERVICE_DIRECTOR,
    taskKey: 'director',
    path: paths.simplifiedAccount.settings.adyenDetails.serviceDirector.details,
  },
  {
    linkText: 'Tell us why your service takes payments',
    id: AdyenTaskIdentifier.REASON_FOR_TAKING_PAYMENTS,
    taskKey: 'reasonForTakingPayments',
    path: paths.simplifiedAccount.settings.adyenDetails.reasonForTakingPayments,
  },
]

export { AdyenTaskDefinition, ORGANISATION_DETAILS_TASK, LEGAL_TERMS_TASK, ORGANISATION_DETAILS_GROUP_TASKS }
