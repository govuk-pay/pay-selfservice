import { UserFixture } from '@test/fixtures/user/user.fixture'
import { ServiceFixture } from '@test/fixtures/service/service.fixture'
import { GatewayAccountFixture } from '@test/fixtures/gateway-account/gateway-account.fixture'
import { PaymentProvider } from '@models/constants/payment-provider'
import { getUser } from '@test/cypress/stubs/simplified-account/user-stubs'
import * as GatewayAccountStubs from '@test/cypress/stubs/simplified-account/gateway-account-stubs'
import { checkServiceNavigation } from '@test/cypress/integration/simplified-account/common/assertions'
import { AdyenAccountSetupFixture } from '@test/fixtures/gateway-account/adyen-account-setup.fixture'
import * as AdyenStubs from '@test/cypress/stubs/simplified-account/adyen-psp-stubs'
import { CredentialFixture } from '@test/fixtures/gateway-account/credential.fixture'

const USER_EXTERNAL_ID = 'user-123-abc'
const SERVICE_EXTERNAL_ID = 'service456def'
const LIVE_ACCOUNT_TYPE = 'live'
const GATEWAY_ACCOUNT_ID = 12
const ADYEN_CREDENTIAL_EXTERNAL_ID = 'adyen-credential-123-abc'
const BALANCE_ACCOUNT_ID = 'BA-456'

const BANK_DETAILS_PATH = `/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/adyen-details/${ADYEN_CREDENTIAL_EXTERNAL_ID}/bank-details`
const TASK_LIST_PATH = `/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/switch-psp/switch-to-adyen`

const gatewayAccountFixture = GatewayAccountFixture.forSwitchingPsp(
  PaymentProvider.STRIPE,
  PaymentProvider.ADYEN,
  [],
  [
    {
      externalId: ADYEN_CREDENTIAL_EXTERNAL_ID,
      credentials: CredentialFixture.forAdyen({ balanceAccountId: BALANCE_ACCOUNT_ID }),
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
})
const userFixture = UserFixture.asServiceAdmin([serviceFixture], { externalId: USER_EXTERNAL_ID })

const adyenAccountSetup = AdyenAccountSetupFixture.NotStarted({
  serviceExternalId: SERVICE_EXTERNAL_ID,
  credentialExternalId: ADYEN_CREDENTIAL_EXTERNAL_ID,
})

const setStubs = (additionalStubs: object[] = []) => {
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
      'bank_details'
    ).success(),
    AdyenStubs.createTransferInstrument().success({ id: 'transfer-123' }),
    AdyenStubs.createSweep(BALANCE_ACCOUNT_ID).success({ id: 'sweep-456' }),
    ...additionalStubs,
  ])
}

describe(`Organisation's bank details`, () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })

  it('accessibility check', () => {
    setStubs()

    cy.visit(BANK_DETAILS_PATH)
    cy.a11yCheck()
  })

  it('should display correct page title and headings', () => {
    setStubs()

    cy.visit(BANK_DETAILS_PATH)

    checkServiceNavigation('Switch provider to Adyen now', TASK_LIST_PATH)
    cy.get('h1').should('contain.text', `Organisation’s bank details`)
  })

  describe('for a service that is migrating to adyen', () => {
    it('should display a back link to the switch-to-adyen task list', () => {
      setStubs()

      cy.visit(BANK_DETAILS_PATH)

      cy.get('.govuk-back-link').should('have.attr', 'href', TASK_LIST_PATH)
    })

    it('should display sort code and account number inputs', () => {
      setStubs()

      cy.visit(BANK_DETAILS_PATH)

      cy.get('#sort-code').should('exist')
      cy.get('#account-number').should('exist')
    })

    it('should redirect to the task list when continue is pressed', () => {
      setStubs()

      cy.visit(BANK_DETAILS_PATH)

      cy.get('#sort-code').type('123456')
      cy.get('#account-number').type('12345678')
      cy.get('#bank-details-submit').click()

      cy.location('pathname').should('eq', TASK_LIST_PATH)
    })

    describe('when the form is submitted empty', () => {
      const expectedErrors = [
        { field: '#sort-code', message: 'Enter a sort code' },
        { field: '#account-number', message: 'Enter an account number' },
      ]

      beforeEach(() => {
        setStubs()
        cy.visit(BANK_DETAILS_PATH)
        cy.get('#bank-details-submit').click()
      })

      it('should stay on the bank details page', () => {
        cy.location('pathname').should('eq', BANK_DETAILS_PATH)
        cy.a11yCheck()
      })

      it('should prefix the page title with "Error:"', () => {
        cy.title().should('match', /^Error: Organisation’s bank details - Settings - /)
      })

      it('should display an error summary', () => {
        cy.get('.govuk-error-summary').should('be.visible').and('contain', 'There is a problem')
        cy.get('.govuk-error-summary__list li').should('have.length', expectedErrors.length)
        expectedErrors.forEach(({ field, message }, index) => {
          cy.get('.govuk-error-summary__list li').eq(index).find(`a[href="${field}"]`).should('contain', message)
        })
      })

      it('should display an error for every field', () => {
        expectedErrors.forEach(({ field, message }) => {
          cy.get(`${field}-error`).should('be.visible').and('contain', message)
        })
      })
    })

    describe('when the form is submitted with invalid values', () => {
      beforeEach(() => {
        setStubs()
        cy.visit(BANK_DETAILS_PATH)
        cy.get('#sort-code').type('12345')
        cy.get('#account-number').type('ABCDEF')
        cy.get('#bank-details-submit').click()
      })

      it('should display the errors and keep the entered values', () => {
        cy.get('#sort-code-error').should('contain', 'Sort code must be 6 digits long')
        cy.get('#account-number-error').should('contain', 'Enter a valid account number')
        cy.get('#sort-code').should('have.value', '12345')
        cy.get('#account-number').should('have.value', 'ABCDEF')
      })
    })
  })

  describe('for a service not migrating to Adyen', () => {
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

      it('should return a 404 when attempting to view bank details', () => {
        cy.request({
          url: BANK_DETAILS_PATH,
          failOnStatusCode: false,
        }).then((response) => {
          expect(response.status).to.eq(404)
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

      it('should return a 404 when attempting to view bank details', () => {
        cy.request({
          url: BANK_DETAILS_PATH,
          failOnStatusCode: false,
        }).then((response) => {
          expect(response.status).to.eq(404)
        })
      })
    })
  })
})
