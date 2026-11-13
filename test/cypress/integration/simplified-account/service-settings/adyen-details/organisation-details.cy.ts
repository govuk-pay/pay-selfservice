import { UserFixture } from '@test/fixtures/user/user.fixture'
import { ServiceFixture } from '@test/fixtures/service/service.fixture'
import { MerchantDetailsFixture } from '@test/fixtures/service/merchant-details.fixture'
import { GatewayAccountFixture } from '@test/fixtures/gateway-account/gateway-account.fixture'
import { PaymentProvider } from '@models/constants/payment-provider'
import { getUser } from '@test/cypress/stubs/simplified-account/user-stubs'
import * as GatewayAccountStubs from '@test/cypress/stubs/simplified-account/gateway-account-stubs'
import { checkServiceNavigation } from '@test/cypress/integration/simplified-account/common/assertions'
import { AdyenAccountSetupFixture } from '@test/fixtures/gateway-account/adyen-account-setup.fixture'
import * as AdyenStubs from '@test/cypress/stubs/simplified-account/adyen-psp-stubs'
import StripeStubs from '@test/cypress/stubs/stripe-psp-stubs'

const USER_EXTERNAL_ID = 'user-123-abc'
const SERVICE_EXTERNAL_ID = 'service456def'
const LIVE_ACCOUNT_TYPE = 'live'
const GATEWAY_ACCOUNT_ID = 12
const ADYEN_CREDENTIAL_EXTERNAL_ID = 'adyen-credential-123-abc'
const ADYEN_LEGAL_ENTITY_ID = 'LE123'

const ADYEN_DETAILS_BASE_URL = `/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/adyen-details/${ADYEN_CREDENTIAL_EXTERNAL_ID}/organisation-details`

const ORGANISATION_DETAILS_PATH = `${ADYEN_DETAILS_BASE_URL}/details`
const TAKING_PAYMENTS_PATH = `${ADYEN_DETAILS_BASE_URL}/reason-for-taking-payments`
const REGISTERED_FOR_VAT_PATH = `${ADYEN_DETAILS_BASE_URL}/registered-for-vat`
const NOT_REGISTERED_FOR_VAT_PATH = `${ADYEN_DETAILS_BASE_URL}/not-registered-for-vat`
const VAT_NUMBER_PATH = `${ADYEN_DETAILS_BASE_URL}/vat-number`
const HAS_COMPANY_REGISTRATION_PATH = `${ADYEN_DETAILS_BASE_URL}/has-company-registration-number`
const ENTER_COMPANY_REGISTRATION_PATH = `${ADYEN_DETAILS_BASE_URL}/company-registration-number`
const ORG_REGISTRATION_UPLOAD_PATH = `${ADYEN_DETAILS_BASE_URL}/organisation-registration/upload`
const TASK_LIST_PATH = `/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/switch-psp/switch-to-adyen`

const gatewayAccountFixture = GatewayAccountFixture.forSwitchingPsp(
  PaymentProvider.STRIPE,
  PaymentProvider.ADYEN,
  [],
  [
    {
      externalId: ADYEN_CREDENTIAL_EXTERNAL_ID,
    },
  ],
  {
    id: GATEWAY_ACCOUNT_ID,
    type: LIVE_ACCOUNT_TYPE,
    serviceId: SERVICE_EXTERNAL_ID,
  }
)
const serviceFixture = new ServiceFixture({
  externalId: SERVICE_EXTERNAL_ID,
  gatewayAccountIds: [`${gatewayAccountFixture.id}`],
  merchantDetails: new MerchantDetailsFixture({ telephoneNumber: '01234 567890' }),
})
const userFixture = UserFixture.asServiceAdmin([serviceFixture], { externalId: USER_EXTERNAL_ID })

const adyenAccountSetup = AdyenAccountSetupFixture.NotStarted({
  serviceExternalId: SERVICE_EXTERNAL_ID,
  credentialExternalId: ADYEN_CREDENTIAL_EXTERNAL_ID,
})

const setStubs = (additionalStubs = []) => {
  cy.task('setupStubs', [
    getUser(USER_EXTERNAL_ID).success(userFixture),
    GatewayAccountStubs.getByServiceExternalIdAndAccountType(SERVICE_EXTERNAL_ID, LIVE_ACCOUNT_TYPE).success(
      gatewayAccountFixture
    ),
    GatewayAccountStubs.getAdyenSetupTasks(
      SERVICE_EXTERNAL_ID,
      LIVE_ACCOUNT_TYPE,
      ADYEN_CREDENTIAL_EXTERNAL_ID,
      adyenAccountSetup.toAdyenAccountSetupData().tasks
    ).success(),
    GatewayAccountStubs.patchAdyenAccountTask(
      SERVICE_EXTERNAL_ID,
      LIVE_ACCOUNT_TYPE,
      ADYEN_CREDENTIAL_EXTERNAL_ID,
      'organisation_details'
    ).success(),
    AdyenStubs.createAccountHolder().success({ id: 'account-holder-123', legalEntityId: ADYEN_LEGAL_ENTITY_ID }),
    AdyenStubs.createLegalEntity().success({ id: ADYEN_LEGAL_ENTITY_ID }),
    GatewayAccountStubs.patchUpdateCredentialsSuccessByServiceExternalIdAndType(
      SERVICE_EXTERNAL_ID,
      LIVE_ACCOUNT_TYPE,
      ADYEN_CREDENTIAL_EXTERNAL_ID,
      USER_EXTERNAL_ID,
      [
        {
          op: 'replace',
          path: 'credentials',
          value: { legal_entity_id: ADYEN_LEGAL_ENTITY_ID },
        },
        {
          op: 'replace',
          path: 'credentials',
          value: { balance_account_id: 'balance-account-123' },
        },
        {
          op: 'replace',
          path: 'credentials',
          value: { account_holder_id: 'account-holder-123' },
        },
      ]
    ),
    GatewayAccountStubs.patchUpdateCredentialsSuccessByServiceExternalIdAndType(
      SERVICE_EXTERNAL_ID,
      LIVE_ACCOUNT_TYPE,
      ADYEN_CREDENTIAL_EXTERNAL_ID,
      USER_EXTERNAL_ID,
      [
        {
          op: 'replace',
          path: 'credentials',
          value: { store_id: 'store-123' },
        },
      ]
    ),
    AdyenStubs.createBalanceAccount().success({ id: 'balance-account-123', accountHolderId: 'account-holder-123' }),
    AdyenStubs.createBusinessLine().success({ id: 'BL123' }),
    StripeStubs.retrieveAccountDetails({ stripeAccountId: 'a-stripe-account', statementDescriptor: 'TEST SERVICE' }),
    AdyenStubs.createStore().success({ id: 'store-123' }),
    AdyenStubs.requestPaymentMethod('test').success({ id: 'PM3227C223224K5FH84M8CBNH' }),
    ...additionalStubs,
  ])
}

describe(`Organisation details`, () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })

  describe('for a service that is migrating to adyen', () => {
    // skipped as sequence has changed - will be address in subsequent PR
    it('should walk through flow in sequence if registered for VAT and has organisation number are true', () => {
      setStubs()

      // organisation details
      cy.visit(ORGANISATION_DETAILS_PATH)
      cy.a11yCheck()

      checkServiceNavigation('Switch provider to Adyen now', TASK_LIST_PATH)
      organisationDetailsFormFill()

      // reason for taking payments
      reasonForTakingPaymentsFormFill()

      // registered for VAT
      registeredForVatFormFill(true)

      // VAT registration number
      cy.location('pathname').should('eq', VAT_NUMBER_PATH)
      cy.a11yCheck()
      cy.get('h1').should('contain.text', 'Tell us your VAT registration number')
      cy.get('.govuk-back-link').should('have.attr', 'href', REGISTERED_FOR_VAT_PATH)
      cy.get('#vat-registration-number').should('exist')

      //// sad path
      cy.get('#vat-registration-number-submit').click()
      cy.get('.govuk-error-summary')
        .should('be.visible')
        .and('contain', 'There is a problem')
        .and('contain', 'Enter a VAT number')
      cy.get('#vat-registration-number-error').should('be.visible').and('contain', 'Enter a VAT number')

      //// happy path
      cy.get('#vat-registration-number').type('GB123456789')
      cy.get('#vat-registration-number-submit').click()

      // has company registration number
      hasCompanyRegistrationFormFill(VAT_NUMBER_PATH, true)

      // company registration number
      cy.location('pathname').should('eq', ENTER_COMPANY_REGISTRATION_PATH)
      cy.a11yCheck()

      cy.get('h1').should('contain.text', 'Tell us your company registration number')
      cy.get('.govuk-back-link').should('have.attr', 'href', HAS_COMPANY_REGISTRATION_PATH)
      cy.get('#company-registration-number').should('exist')

      cy.get('#company-registration-number').type('12345678')
      cy.get('#company-registration-number-submit').click()

      cy.location('pathname').should('eq', TASK_LIST_PATH)
    })

    it('should walk through flow in sequence if registered for VAT and has organisation number are false', () => {
      setStubs()

      // organisation details
      cy.visit(ORGANISATION_DETAILS_PATH)
      cy.a11yCheck()

      checkServiceNavigation('Switch provider to Adyen now', TASK_LIST_PATH)
      organisationDetailsFormFill()

      // reason for taking payments
      reasonForTakingPaymentsFormFill()

      // registered for VAT
      registeredForVatFormFill(false)

      // why not registered for VAT
      cy.location('pathname').should('eq', NOT_REGISTERED_FOR_VAT_PATH)
      cy.a11yCheck()
      cy.get('h1').should('contain.text', 'Why is your organisation not registered for VAT?')
      cy.get('.govuk-back-link').should('have.attr', 'href', REGISTERED_FOR_VAT_PATH)

      cy.get('[data-cy="below-vat-threshold"]').should('exist')
      cy.get('[data-cy="exempt"]').should('exist')

      //// sad path
      cy.get('#not-registered-for-vat-submit').click()
      cy.get('.govuk-error-summary')
        .should('be.visible')
        .and('contain', 'There is a problem')
        .and('contain', 'You must make a selection')
      cy.get('#notRegisteredForVat-error').should('be.visible').and('contain', 'You must make a selection')

      //// happy path
      cy.get('[data-cy="exempt"]').check()
      cy.get('#not-registered-for-vat-submit').click()

      // has company registration number
      hasCompanyRegistrationFormFill(NOT_REGISTERED_FOR_VAT_PATH, false)

      // organisation registration upload
      cy.location('pathname').should('eq', ORG_REGISTRATION_UPLOAD_PATH)
      cy.a11yCheck()
      cy.get('h1').should('contain.text', `Upload a document showing your organisation's registration`)
      cy.get('.govuk-back-link').should('have.attr', 'href', HAS_COMPANY_REGISTRATION_PATH)

      cy.get(`#government-entity-document`).selectFile('test/test-helpers/companydetails.png')
      cy.get(`#company-registration-document-submit`).click()

      cy.location('pathname').should('eq', TASK_LIST_PATH)
    })
  })

  describe('for a service not migrating to Adyen', () => {
    const paths = [
      ORGANISATION_DETAILS_PATH,
      TAKING_PAYMENTS_PATH,
      REGISTERED_FOR_VAT_PATH,
      NOT_REGISTERED_FOR_VAT_PATH,
      HAS_COMPANY_REGISTRATION_PATH,
      VAT_NUMBER_PATH,
      ENTER_COMPANY_REGISTRATION_PATH,
      ORG_REGISTRATION_UPLOAD_PATH,
    ]

    describe('where the service is switching to a different PSP', () => {
      const WORLDPAY_CREDENTIAL_EXTERNAL_ID = 'worldpay-credential-123-abc'

      beforeEach(() => {
        cy.task('clearStubs')

        const gatewayAccountSwitchingToWorldpay = GatewayAccountFixture.forSwitchingPsp(
          PaymentProvider.STRIPE,
          PaymentProvider.WORLDPAY,
          [],
          [
            {
              externalId: WORLDPAY_CREDENTIAL_EXTERNAL_ID,
            },
          ],
          {
            id: GATEWAY_ACCOUNT_ID,
            serviceId: SERVICE_EXTERNAL_ID,
          }
        )
        const serviceFixture = new ServiceFixture({
          externalId: SERVICE_EXTERNAL_ID,
          gatewayAccountIds: [`${gatewayAccountSwitchingToWorldpay.id}`],
          currentGoLiveStage: 'LIVE',
        })
        const userFixture = UserFixture.asServiceAdmin([serviceFixture], { externalId: USER_EXTERNAL_ID })
        cy.task('setupStubs', [
          getUser(USER_EXTERNAL_ID).success(userFixture),
          GatewayAccountStubs.getByServiceExternalIdAndAccountType(SERVICE_EXTERNAL_ID, LIVE_ACCOUNT_TYPE).success(
            gatewayAccountSwitchingToWorldpay
          ),
        ])
      })

      it('should return a 404 for all pages', () => {
        paths.forEach((path) => {
          cy.request({
            url: path,
            failOnStatusCode: false,
          }).then((response) => {
            expect(response.status).to.eq(404)
          })
        })
      })
    })

    describe('where the service is not switching PSP', () => {
      beforeEach(() => {
        cy.task('clearStubs')
        const adyenGatewayAccount = GatewayAccountFixture.forAdyen({
          type: LIVE_ACCOUNT_TYPE,
        })

        const serviceFixture = new ServiceFixture({
          externalId: SERVICE_EXTERNAL_ID,
          gatewayAccountIds: [`${adyenGatewayAccount.id}`],
          currentGoLiveStage: 'LIVE',
        })
        const userFixture = UserFixture.asServiceAdmin([serviceFixture], { externalId: USER_EXTERNAL_ID })

        cy.task('setupStubs', [
          getUser(USER_EXTERNAL_ID).success(userFixture),
          GatewayAccountStubs.getByServiceExternalIdAndAccountType(SERVICE_EXTERNAL_ID, LIVE_ACCOUNT_TYPE).success(
            adyenGatewayAccount
          ),
        ])
      })

      it('should return a 404 for all pages', () => {
        paths.forEach((path) => {
          cy.request({
            url: path,
            failOnStatusCode: false,
          }).then((response) => {
            expect(response.status).to.eq(404)
          })
        })
      })
    })
  })
})

const organisationDetailsFormFill = () => {
  cy.get('h1').should('contain.text', 'Organisation details')
  cy.get('.govuk-back-link').should('have.attr', 'href', TASK_LIST_PATH)

  cy.get('#organisation-name').should('exist')
  cy.get('#address-line1').should('exist')
  cy.get('#address-line2').should('exist')
  cy.get('#address-city').should('exist')
  cy.get('#address-country').should('exist')
  cy.get('#address-postcode').should('exist')
  cy.get('#email').should('exist')

  cy.get('#organisation-name').type('Test Organisation')
  cy.get('#address-line1').type('1 Test Street')
  cy.get('#address-city').type('Testville')
  cy.get('#address-postcode').type('T3 5TT')
  cy.get('#email').type('some-tax@example.com')
  cy.get('#organisation-details-submit').click()
}

const reasonForTakingPaymentsFormFill = () => {
  cy.location('pathname').should('eq', TAKING_PAYMENTS_PATH)
  cy.a11yCheck()

  cy.get('h1').should('contain.text', 'What will your service be taking payments for?')
  cy.get('.govuk-back-link').should('have.attr', 'href', ORGANISATION_DETAILS_PATH)

  cy.get('[data-cy="radio-general-local"]').should('exist')
  cy.get('[data-cy="radio-police-safety"]').should('exist')
  cy.get('[data-cy="radio-everything-else"]').should('exist')

  //// sad path
  cy.get('#reason-for-taking-payments-submit').click()
  cy.get('.govuk-error-summary')
    .should('be.visible')
    .and('contain', 'There is a problem')
    .and('contain', 'You must make a selection')
  cy.get('#governmentActivity-error').should('be.visible').and('contain', 'You must make a selection')

  //// happy path
  cy.get('[data-cy="radio-general-local"]').check()
  cy.get('#reason-for-taking-payments-submit').click()
}

const registeredForVatFormFill = (registeredForVat: boolean) => {
  cy.location('pathname').should('eq', REGISTERED_FOR_VAT_PATH)
  cy.a11yCheck()

  cy.get('h1').should('contain.text', 'Is your organisation registered for VAT?')
  cy.get('.govuk-back-link').should('have.attr', 'href', TAKING_PAYMENTS_PATH)

  cy.get('[data-cy="registered-for-vat-yes"]').should('exist')
  cy.get('[data-cy="registered-for-vat-no"]').should('exist')

  //// sad path
  cy.get('#registered-for-vat-submit').click()
  cy.get('.govuk-error-summary')
    .should('be.visible')
    .and('contain', 'There is a problem')
    .and('contain', 'You must make a selection')
  cy.get('#registeredForVat-error').should('be.visible').and('contain', 'You must make a selection')

  //// happy path
  if (registeredForVat) {
    cy.get('[data-cy="registered-for-vat-yes"]').check()
  } else {
    cy.get('[data-cy="registered-for-vat-no"]').check()
  }
  cy.get('#registered-for-vat-submit').click()
}

const hasCompanyRegistrationFormFill = (backLink: string, hasCompanyRegNumber: boolean) => {
  cy.location('pathname').should('eq', HAS_COMPANY_REGISTRATION_PATH)
  cy.a11yCheck()

  cy.get('h1').should('contain.text', 'Does your organisation have a company registration number?')
  cy.get('.govuk-back-link').should('have.attr', 'href', backLink)

  cy.get('[data-cy="radio-yes"]').should('exist')
  cy.get('[data-cy="radio-no"]').should('exist')

  //// sad path
  cy.get('#has-company-registration-number-submit').click()
  cy.get('.govuk-error-summary')
    .should('be.visible')
    .and('contain', 'There is a problem')
    .and('contain', 'You must make a selection')
  cy.get('#has-company-registration-number-error').should('be.visible').and('contain', 'You must make a selection')

  //// happy path
  if (hasCompanyRegNumber) {
    cy.get('[data-cy="radio-yes"]').check()
  } else {
    cy.get('[data-cy="radio-no"]').check()
  }
  cy.get('#has-company-registration-number-submit').click()
}
