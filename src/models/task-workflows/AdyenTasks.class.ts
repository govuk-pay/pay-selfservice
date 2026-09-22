import { Task, Tasks } from '@models/task-workflows/Tasks.class'
import { AdyenTaskIdentifier } from '@models/task-workflows/task-identifiers/adyen-task-identifiers'
import TaskStatus from '@models/constants/task-status'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import Service from '@models/service/Service.class'
import GatewayAccount from '@models/gateway-account/GatewayAccount.class'
import { AdyenAccountSetup, AdyenAccountSetupTaskName } from '@models/gateway-account/AdyenAccountSetup.class'
import {
  AdyenTaskDefinition,
  LEGAL_TERMS_TASK,
  ORGANISATION_DETAILS_GROUP_TASKS,
  ORGANISATION_DETAILS_TASK,
} from '@models/task-workflows/adyen-task-definitions'

class AdyenTask extends Task {
  constructor(linkText: string, id: AdyenTaskIdentifier, href: string) {
    super(linkText, id, href)
  }
}

export class AdyenTasks extends Tasks<AdyenTask> {
  confirmOrganisationTasks: AdyenTask[]
  acceptLegalTermsTasks: AdyenTask[]
  completeOrganisationDetailsTasks: AdyenTask[]

  constructor(
    confirmOrganisationTasks: AdyenTask[],
    acceptLegalTermsTasks: AdyenTask[],
    completeOrganisationDetailsTasks: AdyenTask[]
  ) {
    super([...confirmOrganisationTasks, ...acceptLegalTermsTasks, ...completeOrganisationDetailsTasks])
    this.confirmOrganisationTasks = confirmOrganisationTasks
    this.acceptLegalTermsTasks = acceptLegalTermsTasks
    this.completeOrganisationDetailsTasks = completeOrganisationDetailsTasks
  }

  static forProviderSwitching(service: Service, gatewayAccount: GatewayAccount, accountSetup: AdyenAccountSetup) {
    // retrieve the cred id.
    const switchingCredentialId = gatewayAccount.getSwitchingCredential().externalId

    // func to check if a given task has been completed.
    const isTaskCompleted = (taskKey: AdyenAccountSetupTaskName) => accountSetup.tasks[taskKey].status === 'COMPLETED'

    // generic func to build a task model.
    const buildTask = (taskDefinition: AdyenTaskDefinition, required: boolean) => {
      const status = !required
        ? TaskStatus.CANNOT_START
        : isTaskCompleted(taskDefinition.taskKey)
          ? TaskStatus.COMPLETED
          : TaskStatus.NOT_STARTED

      return new AdyenTask(
        taskDefinition.linkText,
        taskDefinition.id,
        formatServiceAndAccountPathsFor(
          taskDefinition.path,
          service.externalId,
          gatewayAccount.type,
          switchingCredentialId
        )
      ).setStatus(status)
    }

    // check if the tasks have been completed.
    const organisationDetailsCompleted = isTaskCompleted('organisationDetails')
    const legalTermsCompleted = isTaskCompleted('legalTerms')

    // build and return new adyen tasks object
    return new AdyenTasks(
      [buildTask(ORGANISATION_DETAILS_TASK, true)],
      [buildTask(LEGAL_TERMS_TASK, organisationDetailsCompleted)],
      ORGANISATION_DETAILS_GROUP_TASKS.map((taskDefinition) => buildTask(taskDefinition, legalTermsCompleted))
    )
  }
}
