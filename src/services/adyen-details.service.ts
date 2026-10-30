import { GatewayAccountCredentialUpdateRequest } from '@models/gateway-account-credential/GatewayAccountCredentialUpdateRequest.class'
import ConnectorClient from '@services/clients/pay/ConnectorClient.class'
import {
  GovernmentActivity,
  INDUSTRY_CODE_MAP,
  OrganisationDetailsSession,
} from '@controllers/simplified-account/settings/adyen-details/organisation-details/constants'
import { Types } from '@adyen/api-library'
import { CreateBankDetailsBody } from '@controllers/simplified-account/settings/adyen-details/bank-details.controller'
import { BankAccountAccountIdentification } from '@adyen/api-library/lib/src/typings/balancePlatform/bankAccountAccountIdentification'
import { UKLocalAccountIdentification } from '@adyen/api-library/lib/src/typings/balancePlatform/uKLocalAccountIdentification'
import { TransferInstrumentInfo } from '@adyen/api-library/lib/src/typings/legalEntityManagement/transferInstrumentInfo'
import createLogger from '@utils/logger'
import {
  acceptTermsOfService,
  createBusinessLine,
  createLegalEntity,
  createTransferInstrument,
  getLegalEntity,
  getTermsOfService,
  updateLegalEntity,
  generatePciQuestionnaire,
  signPciQuestionnaire,
} from '@services/clients/adyen/adyen-legal-entity-management.client'
import { createStore as createAdyenStore, requestPaymentMethod } from '@services/clients/adyen/adyen-management.client'
import * as AdyenBalancePlatformClient from '@services/clients/adyen/adyen-balance-platform.client'
import { ServiceDirectorSession } from '@controllers/simplified-account/settings/adyen-details/service-director/constants'
import { ResponsiblePersonSession } from '@controllers/simplified-account/settings/adyen-details/responsible-person/constants'
import { Individual } from '@adyen/api-library/lib/src/typings/legalEntityManagement/individual'
import { PaymentMethodSetupInfo } from '@adyen/api-library/lib/src/typings/management/paymentMethodSetupInfo'
import { BusinessLineInfo } from '@adyen/api-library/lib/src/typings/legalEntityManagement/businessLineInfo'
import { SweepSchedule } from '@adyen/api-library/lib/src/typings/balancePlatform/sweepSchedule'
import { CreateSweepConfigurationV2 } from '@adyen/api-library/lib/src/typings/balancePlatform/createSweepConfigurationV2'
import { createSweep } from './clients/adyen/adyen-balance-platform.client'
import Service from '@models/service/Service.class'
import { AccountHolder } from '@adyen/api-library/lib/src/typings/balancePlatform/accountHolder'
import { formatPhoneNumberWithCountryCode } from '@utils/telephone-number-utils'
import { InvalidConfigurationError } from '@root/errors'

type LegalEntityInfoRequiredType = Types.legalEntityManagement.LegalEntityInfoRequiredType
type Organization = Types.legalEntityManagement.Organization
type StoreCreationWithMerchantCodeRequest = Types.management.StoreCreationWithMerchantCodeRequest

export interface CreateStoreParams {
  businessLineId: string
  balanceAccountId: string
  serviceName: string
  statementDescriptor: string
  telephoneNumber: string
  organisationDetails: OrganisationDetailsSession
}
type AccountHolderInfo = Types.balancePlatform.AccountHolderInfo
type BalanceAccountInfo = Types.balancePlatform.BalanceAccountInfo
type GeneratePciDescriptionResponse = Types.legalEntityManagement.GeneratePciDescriptionResponse

const connectorClient = new ConnectorClient()
const logger = createLogger(__filename)

const REQUIRED_VERIFICATION_CAPABILITIES = [
  'receiveFromPlatformPayments',
  'receiveFromBalanceAccount',
  'sendToBalanceAccount',
  'sendToTransferInstrument',
  'receivePayments',
]

const SERVICE_DIRECTOR_ASSOCIATION_TYPES = [
  Types.legalEntityManagement.LegalEntityAssociation.TypeEnum.Director,
  Types.legalEntityManagement.LegalEntityAssociation.TypeEnum.UboThroughOwnership,
  Types.legalEntityManagement.LegalEntityAssociation.TypeEnum.UboThroughControl,
]

const setAdyenStoreId = async (
  serviceExternalId: string,
  accountType: string,
  credentialExternalId: string,
  userExternalId: string,
  storeId: string
) => {
  return connectorClient.gatewayAccounts.patchCredentialsByServiceExternalIdAndAccountType(
    serviceExternalId,
    accountType,
    credentialExternalId,
    new GatewayAccountCredentialUpdateRequest(userExternalId).replace().credentials().storeId(storeId)
  )
}

const createOrganisationLegalEntity = (session: OrganisationDetailsSession, service: Service) => {
  const organization: Organization = {
    type: Types.legalEntityManagement.Organization.TypeEnum.GovernmentalOrganization,
    legalName: session.organisationName ?? '',
    registeredAddress: {
      street: session.addressLine1,
      street2: session.addressLine2,
      city: session.addressCity,
      postalCode: session.addressPostcode,
      country: session.addressCountry ?? '',
    },
    registrationNumber: session.companyRegistrationNumber,
    vatNumber: ensureVatRegistrationPrefix(session.vatRegistrationNumber),
    doingBusinessAs: service.name,
    countryOfGoverningLaw: 'GB',
    support: {
      email: session.email,
      phone: {
        number: formatPhoneNumberWithCountryCode(service.merchantDetails!.telephoneNumber),
      },
    },
    phone: {
      number: service.merchantDetails!.telephoneNumber,
    },
  }

  const legalEntityInfo: LegalEntityInfoRequiredType = {
    type: Types.legalEntityManagement.LegalEntityInfoRequiredType.TypeEnum.Organization,
    organization,
  }

  return createLegalEntity(legalEntityInfo)
}

const createOrganisation = async (
  session: OrganisationDetailsSession,
  governmentActivity: GovernmentActivity,
  service: Service,
  accountType: string,
  switchingCredentialId: string,
  userExternalId: string
) => {
  const legalEntity = await createOrganisationLegalEntity(session, service)

  if (!service.merchantDetails?.url) {
    throw new InvalidConfigurationError(`No URL set in merchant details [service_external_id: ${service.externalId}]`)
  }

  const businessLine = await createBusinessLine({
    service: BusinessLineInfo.ServiceEnum.PaymentProcessing,
    industryCode: INDUSTRY_CODE_MAP[governmentActivity],
    legalEntityId: legalEntity.id,
    salesChannels: ['eCommerce'],
    webData: [{ webAddress: service.merchantDetails.url }],
  })
  const accountHolder = await createAccountHolder(legalEntity.id, service.name)
  const balanceAccount = await createBalanceAccount(accountHolder.id, service.name)

  await connectorClient.gatewayAccounts.patchCredentialsByServiceExternalIdAndAccountType(
    service.externalId,
    accountType,
    switchingCredentialId,
    new GatewayAccountCredentialUpdateRequest(userExternalId)
      .replace()
      .credentials()
      .legalEntityId(legalEntity.id)
      .replace()
      .credentials()
      .balanceAccountId(balanceAccount.id)
      .replace()
      .credentials()
      .accountHolderId(accountHolder.id)
  )

  return { legalEntity, businessLine, accountHolder, balanceAccount }
}

const addPaymentMethodsToStore = async (storeId: string, businessLineId: string, merchantId: string) => {
  await addCardPaymentMethods(storeId, businessLineId, merchantId)
  await addGooglePayPaymentMethods(storeId, businessLineId, merchantId)
  await addPayByBankPaymentMethod(storeId, businessLineId, merchantId)

  logger.info(`Required payment methods added to store`, {
    store_id: storeId,
  })
}

async function addCardPaymentMethods(storeId: string, businessLineId: string, merchantId: string) {
  const cardPaymentMethods = [
    PaymentMethodSetupInfo.TypeEnum.Visa,
    PaymentMethodSetupInfo.TypeEnum.Mc,
    PaymentMethodSetupInfo.TypeEnum.Jcb,
    PaymentMethodSetupInfo.TypeEnum.Maestro,
    PaymentMethodSetupInfo.TypeEnum.Discover,
    PaymentMethodSetupInfo.TypeEnum.Diners,
    PaymentMethodSetupInfo.TypeEnum.Cup,
    PaymentMethodSetupInfo.TypeEnum.Amex,
  ]

  for (const paymentMethod of cardPaymentMethods) {
    const paymentMethodSetupInfo: PaymentMethodSetupInfo = {
      type: paymentMethod,
      storeIds: [storeId],
      businessLineId: businessLineId,
      countries: ['GB'],
      currencies: ['GBP'],
    }

    await requestPaymentMethod(merchantId, paymentMethodSetupInfo)

    logger.info(`Payment method added to store`, {
      type: paymentMethodSetupInfo.type,
      store_id: storeId,
    })
  }
}

async function addGooglePayPaymentMethods(storeId: string, businessLineId: string, merchantId: string) {
  const googlePayPaymentType = PaymentMethodSetupInfo.TypeEnum.Googlepay

  const googlePayPaySetupInfo: PaymentMethodSetupInfo = {
    type: googlePayPaymentType,
    googlePay: {
      merchantId,
    },
    storeIds: [storeId],
    businessLineId: businessLineId,
    countries: ['GB'],
    currencies: ['GBP'],
  }

  await requestPaymentMethod(merchantId, googlePayPaySetupInfo)

  logger.info(`Payment method added to store`, {
    type: googlePayPaymentType,
    store_id: storeId,
  })
}

async function addPayByBankPaymentMethod(storeId: string, businessLineId: string, merchantId: string) {
  const payByBankPaymentType = PaymentMethodSetupInfo.TypeEnum.Paybybank
  const payByBankSetupInfo: PaymentMethodSetupInfo = {
    type: payByBankPaymentType,
    storeIds: [storeId],
    businessLineId: businessLineId,
    countries: ['GB'],
    currencies: ['GBP'],
  }

  await requestPaymentMethod(merchantId, payByBankSetupInfo)

  logger.info(`Payment method added to store`, {
    type: payByBankPaymentType,
    store_id: storeId,
  })
}

const getAdyenCredentials = async (serviceExternalId: string, accountType: string, switchingCredentialId: string) => {
  const gatewayAccount = await connectorClient.gatewayAccounts.getByServiceExternalIdAndAccountType(
    serviceExternalId,
    accountType
  )
  const adyenCredential = gatewayAccount.gatewayAccountCredentials.find(
    (credential) => credential.externalId === switchingCredentialId
  )
  return adyenCredential?.credentials
}

const createBankDetails = async (
  details: CreateBankDetailsBody,
  serviceExternalId: string,
  accountType: string,
  switchingCredentialId: string
) => {
  const adyenCredentials = await getAdyenCredentials(serviceExternalId, accountType, switchingCredentialId)
  const legalEntityId = adyenCredentials!.legalEntityId!
  const balanceAccountId = adyenCredentials!.balanceAccountId!

  const accountIdentification: BankAccountAccountIdentification = {
    sortCode: details.sortCode,
    accountNumber: details.accountNumber,
    type: UKLocalAccountIdentification.TypeEnum.UkLocal,
  }

  const transferInstrumentInfo: TransferInstrumentInfo = {
    legalEntityId,
    type: TransferInstrumentInfo.TypeEnum.BankAccount,
    bankAccount: {
      accountIdentification,
    },
  }

  const transferInstrument = await createTransferInstrument(transferInstrumentInfo)

  if (!transferInstrument) {
    throw new Error('Transfer instrument creation failed')
  }

  logger.info(`Transfer instrument created for legal entity`, {
    legal_entity_id: legalEntityId,
    transfer_instrument_id: transferInstrument.id,
  })

  const sweepSchedule: SweepSchedule = {
    type: SweepSchedule.TypeEnum.Cron,
    cronExpression: '00 2 * * MON-FRI',
  }

  const createSweepConfiguration: CreateSweepConfigurationV2 = {
    schedule: sweepSchedule,
    counterparty: { transferInstrumentId: transferInstrument.id },
    currency: 'GBP',
    category: CreateSweepConfigurationV2.CategoryEnum.Bank,
    type: CreateSweepConfigurationV2.TypeEnum.Push,
    priorities: [CreateSweepConfigurationV2.PrioritiesEnum.Fast, CreateSweepConfigurationV2.PrioritiesEnum.Regular],
  }

  const sweep = await createSweep(balanceAccountId, createSweepConfiguration)

  if (!sweep) {
    throw new Error('Payout schedules sweep creation failed')
  }

  logger.info(`Custom payout schedules sweep created`, {
    sweep_id: sweep.id,
  })

  return
}

const createResponsiblePerson = async (session: ResponsiblePersonSession, organisationLegalEntityId: string) => {
  const individual: Individual = {
    name: {
      firstName: session.firstName ?? '',
      lastName: session.lastName ?? '',
    },
    birthData: {
      dateOfBirth: formatDateInputs(session.dobDay!, session.dobMonth!, session.dobYear!),
    },
    residentialAddress: {
      street: session.addressLine1,
      street2: session.addressLine2,
      city: session.addressCity,
      postalCode: session.addressPostcode,
      country: session.addressCountry ?? 'GB',
    },
    email: session.email,
    phone: {
      number: toUkInternationalNumber(session.telephoneNumber ?? ''),
      phoneCountryCode: session.numberCountryCode ?? 'GB',
    },
  }

  const individualLegalEntityInfo: LegalEntityInfoRequiredType = {
    type: Types.legalEntityManagement.LegalEntityInfoRequiredType.TypeEnum.Individual,
    individual,
  }

  const responsiblePerson = await createLegalEntity(individualLegalEntityInfo)

  const organisation = await getLegalEntity(organisationLegalEntityId)

  const existingAssociations = organisation.entityAssociations ?? []

  const entityAssociationsPayload = {
    entityAssociations: [
      ...existingAssociations,
      {
        legalEntityId: responsiblePerson.id,
        jobTitle: 'Responsible Person',
        type: Types.legalEntityManagement.LegalEntityAssociation.TypeEnum.Signatory,
      },
    ],
  }

  await updateLegalEntity(organisationLegalEntityId, entityAssociationsPayload)

  const { termsOfServiceDocumentId } = await generateTermsOfService(organisationLegalEntityId)

  if (!termsOfServiceDocumentId) {
    throw new Error('Terms of service document ID is not set')
  }
  await signTermsOfService(organisationLegalEntityId, termsOfServiceDocumentId, responsiblePerson.id)

  return responsiblePerson
}

const createAccountHolder = async (organisationLegalEntityId: string, serviceName: string) => {
  const balancePlatformId = process.env.ADYEN_BALANCE_PLATFORM_ID
  if (!balancePlatformId) {
    throw new Error('ADYEN_BALANCE_PLATFORM_ID is not set')
  }

  const accountHolderInfo: AccountHolderInfo = {
    legalEntityId: organisationLegalEntityId,
    balancePlatform: balancePlatformId,
    description: serviceName,
  }

  return AdyenBalancePlatformClient.createAccountHolder(accountHolderInfo)
}

const createBalanceAccount = async (accountHolderId: string, serviceName: string) => {
  const balanceAccountInfo: BalanceAccountInfo = {
    accountHolderId,
    defaultCurrencyCode: 'GBP',
    description: serviceName,
    timeZone: 'UTC',
  }

  return AdyenBalancePlatformClient.createBalanceAccount(balanceAccountInfo)
}

const toUkInternationalNumber = (input: string): string => {
  const cleaned = input.replace(/[\s().-]/g, '')
  return cleaned.startsWith('+') ? cleaned : `+44${cleaned.replace(/^0/, '')}`
}

const createServiceDirector = async (
  serviceDirectorSession: ServiceDirectorSession,
  organisationLegalEntityId: string
) => {
  let organisationLegalEntity
  try {
    organisationLegalEntity = await getLegalEntity(organisationLegalEntityId)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(`Organisation legal entity with ID ${organisationLegalEntityId} not found: ${errorMessage}`)
  }

  if (!serviceDirectorSession.firstName || !serviceDirectorSession.lastName) {
    throw new Error('Service director first name and last name are required')
  }

  const serviceDirectorLegalEntity: LegalEntityInfoRequiredType = {
    type: Types.legalEntityManagement.LegalEntityInfoRequiredType.TypeEnum.Individual,
    individual: {
      birthData: {
        dateOfBirth: formatDateInputs(
          serviceDirectorSession.dobDay!,
          serviceDirectorSession.dobMonth!,
          serviceDirectorSession.dobYear!
        ),
      },
      email: serviceDirectorSession.email,
      name: {
        firstName: serviceDirectorSession.firstName,
        lastName: serviceDirectorSession.lastName,
      },
      residentialAddress: {
        street: serviceDirectorSession.addressLine1,
        ...(serviceDirectorSession.addressLine2 ? { street2: serviceDirectorSession.addressLine2 } : {}),
        city: serviceDirectorSession.addressCity,
        // Allowed formats: L(L)N(O)NLL or L(L)N(O) NLL
        postalCode: serviceDirectorSession.addressPostcode?.toUpperCase().replaceAll(/\s/g, ''),
        country: 'GB',
      },
    },
  }

  let serviceDirector
  try {
    serviceDirector = await createLegalEntity(serviceDirectorLegalEntity)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(`Service director legal entity creation failed: ${errorMessage}`)
  }

  const currentAssociations = organisationLegalEntity.entityAssociations ?? []

  // update the organisation with the person
  try {
    await updateLegalEntity(organisationLegalEntityId, {
      entityAssociations: [
        ...currentAssociations,
        ...SERVICE_DIRECTOR_ASSOCIATION_TYPES.map((type) => ({
          legalEntityId: serviceDirector.id,
          jobTitle: 'Director',
          type,
        })),
      ],
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(
      `Couldn't link director (${serviceDirector.id}) to organisation (${organisationLegalEntityId}): ${errorMessage}`
    )
  }

  // Generate PCI questionnaire
  let pciQuestionnaire: GeneratePciDescriptionResponse

  try {
    pciQuestionnaire = await generatePciQuestionnaire(organisationLegalEntityId)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(`Could not create PCI questionnaire for (${serviceDirector.id}): ${errorMessage}`)
  }

  const pciTemplateReferences = pciQuestionnaire.pciTemplateReferences

  if (!pciTemplateReferences?.length) {
    throw new Error(`PCI questionnaire for (${serviceDirector.id}) returned no PCI template references`)
  }

  // Sign PCI questionnaire
  try {
    await signPciQuestionnaire(organisationLegalEntityId, {
      pciTemplateReferences,
      signedBy: serviceDirector.id,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(`Could not sign PCI questionnaire for (${serviceDirector.id}): ${errorMessage}`)
  }

  return serviceDirector
}

function ensureVatRegistrationPrefix(vatRegistrationNumber: string | undefined): string | undefined {
  if (vatRegistrationNumber === undefined) {
    return undefined
  }
  if (vatRegistrationNumber.startsWith('GB')) {
    return vatRegistrationNumber
  }
  return `GB${vatRegistrationNumber}`
}

const generateTermsOfService = async (legalEntityId: string) => {
  const getTermsOfServiceDocumentRequest: Types.legalEntityManagement.GetTermsOfServiceDocumentRequest = {
    language: 'en',
    type: Types.legalEntityManagement.GetTermsOfServiceDocumentRequest.TypeEnum.AdyenForPlatformsAdvanced,
    termsOfServiceDocumentFormat: 'TXT',
  }

  return getTermsOfService(legalEntityId, getTermsOfServiceDocumentRequest)
}

const signTermsOfService = async (legalEntityId: string, termsOfServiceDocumentId: string, acceptedBy: string) => {
  const acceptTermsOfServiceRequest: Types.legalEntityManagement.AcceptTermsOfServiceRequest = {
    acceptedBy,
  }

  return acceptTermsOfService(legalEntityId, termsOfServiceDocumentId, acceptTermsOfServiceRequest)
}

const createStore = async ({
  businessLineId,
  balanceAccountId,
  serviceName,
  statementDescriptor,
  telephoneNumber,
  organisationDetails,
}: CreateStoreParams) => {
  const merchantId = process.env.ADYEN_LIVE_MERCHANT_ACCOUNT_ID
  if (!merchantId) {
    throw new Error('ADYEN_LIVE_MERCHANT_ACCOUNT_ID is not set')
  }

  const splitConfigurationId = process.env.ADYEN_LIVE_SPLIT_CONFIGURATION_ID
  if (!splitConfigurationId) {
    throw new Error('ADYEN_LIVE_SPLIT_CONFIGURATION_ID is not set')
  }

  const storeCreationRequest: StoreCreationWithMerchantCodeRequest = {
    merchantId,
    description: serviceName,
    shopperStatement: statementDescriptor,
    phoneNumber: toUkInternationalNumber(telephoneNumber),
    address: {
      line1: organisationDetails.addressLine1,
      line2: organisationDetails.addressLine2,
      city: organisationDetails.addressCity,
      postalCode: organisationDetails.addressPostcode,
      country: organisationDetails.addressCountry ?? '',
    },
    businessLineIds: [businessLineId],
    splitConfiguration: {
      balanceAccountId,
      splitConfigurationId,
    },
  }

  const store = await createAdyenStore(storeCreationRequest)
  await addPaymentMethodsToStore(store.id!, businessLineId, merchantId)

  return store
}

const getAccountHolder = async (accountHolderId: string): Promise<AccountHolder> => {
  return AdyenBalancePlatformClient.getAccountHolder(accountHolderId)
}

const isAccountHolderVerified = async (accountHolderId: string): Promise<boolean> => {
  const accountHolder = await getAccountHolder(accountHolderId)
  const capabilities = REQUIRED_VERIFICATION_CAPABILITIES.map(
    (capabilityName) => accountHolder.capabilities?.[capabilityName]
  )
  return capabilities.every((capability) => capability?.allowed ?? false)
}

// Expected format yyyy-MM-dd
function formatDateInputs(dobDay: string, dobMonth: string, dobYear: string): string {
  return `${dobYear}-${dobMonth?.padStart(2, '0')}-${dobDay?.padStart(2, '0')}`
}

export {
  setAdyenStoreId,
  createOrganisation,
  createResponsiblePerson,
  createBankDetails,
  createServiceDirector,
  createAccountHolder,
  createBalanceAccount,
  createStore,
  getAccountHolder,
  isAccountHolderVerified,
}
