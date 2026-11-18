import { UserFixture } from '@test/fixtures/user/user.fixture'
import { ServiceFixture } from '@test/fixtures/service/service.fixture'
import { GatewayAccountFixture } from '@test/fixtures/gateway-account/gateway-account.fixture'
import { PaymentProvider } from '@models/constants/payment-provider'
import { getUser } from '@test/cypress/stubs/simplified-account/user-stubs'
import * as GatewayAccountStubs from '@test/cypress/stubs/simplified-account/gateway-account-stubs'
import { checkServiceNavigation } from '@test/cypress/integration/simplified-account/common/assertions'
import { AdyenAccountSetupFixture } from '@test/fixtures/gateway-account/adyen-account-setup.fixture'

const USER_EXTERNAL_ID = 'user-123-abc'
const SERVICE_EXTERNAL_ID = 'service456def'
const LIVE_ACCOUNT_TYPE = 'live'
const GATEWAY_ACCOUNT_ID = 12
const ADYEN_CREDENTIAL_EXTERNAL_ID = 'adyen-credential-123-abc'

const TASK_LIST_PATH = `/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/switch-psp/switch-to-adyen`
const RESPONSIBLE_PERSON_DETAILS_PATH = `/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/adyen-details/${ADYEN_CREDENTIAL_EXTERNAL_ID}/responsible-person/details`
const RESPONSIBLE_PERSON_ADDRESS_PATH = `/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/adyen-details/${ADYEN_CREDENTIAL_EXTERNAL_ID}/responsible-person/address`
const RESPONSIBLE_PERSON_CONTACT_DETAILS_PATH = `/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/adyen-details/${ADYEN_CREDENTIAL_EXTERNAL_ID}/responsible-person/contact-details`
const RESPONSIBLE_PERSON_REVIEW_PATH = `/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/adyen-details/${ADYEN_CREDENTIAL_EXTERNAL_ID}/responsible-person/check-your-answers`

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
    ...additionalStubs,
  ])
}

describe(`Responsible person - contact details`, () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })

  describe('for a service that is migrating to adyen', () => {
    describe('when navigating to the page directly', () => {
      beforeEach(() => {
        setStubs()
      })

      it('should redirect to the migration tasks page', () => {
        setStubs()

        cy.visit(RESPONSIBLE_PERSON_CONTACT_DETAILS_PATH)

        cy.location('pathname').should('eq', TASK_LIST_PATH)
      })
    })

    describe('when navigating from the address page with fields populated', () => {
      beforeEach(() => {
        setStubs()
        cy.visit(RESPONSIBLE_PERSON_DETAILS_PATH)
        cy.get('#first-name').type('John')
        cy.get('#last-name').type('McClane')

        cy.get('#dob-day').type('25')
        cy.get('#dob-month').type('12')
        cy.get('#dob-year').type('1960')

        cy.get('#responsible-person-details-submit').click()

        cy.get('#address-line1').type('7 Green Lane')
        cy.get('#address-line2').type('Greenfield')
        cy.get('#address-city').type('Greencity')
        cy.get('#address-postcode').type('GR3 3NY')

        cy.get('#responsible-person-address-submit').click()
      })

      it('accessibility check', () => {
        setStubs()
        cy.a11yCheck()
      })

      it('should display correct page content', () => {
        setStubs()

        checkServiceNavigation('Switch provider to Adyen now', TASK_LIST_PATH)
        cy.get('h1').should('contain.text', `Responsible person’s contact details`)
        cy.get('.govuk-back-link').should('have.attr', 'href', RESPONSIBLE_PERSON_ADDRESS_PATH)

        cy.get('#telephone-number').should('exist')
        cy.get('#email').should('exist')
      })

      it('should redirect to the check your answers page when continue is pressed', () => {
        setStubs()

        cy.get('#telephone-number').type('07700 700900')
        cy.get('#email').type('sam@example.com')

        cy.get('#responsible-person-contact-details-submit').click()

        cy.location('pathname').should('eq', RESPONSIBLE_PERSON_REVIEW_PATH)
      })

      describe('when the form is submitted empty', () => {
        const expectedErrors = [
          { field: '#telephone-number', message: 'Enter a telephone number' },
          { field: '#email', message: 'Enter a work email address' },
        ]

        beforeEach(() => {
          cy.get('#responsible-person-contact-details-submit').click()
        })

        it('should stay on the contact details page', () => {
          cy.location('pathname').should('eq', RESPONSIBLE_PERSON_CONTACT_DETAILS_PATH)
          cy.get('.govuk-back-link').should('have.attr', 'href', RESPONSIBLE_PERSON_ADDRESS_PATH)
          cy.a11yCheck()
        })

        it('should prefix the page title with "Error:"', () => {
          cy.title().should('match', /^Error: Responsible person’s contact details - Settings - /)
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
          cy.get('#telephone-number').type('abc')
          cy.get('#email').type('not-an-email')
          cy.get('#responsible-person-contact-details-submit').click()
        })

        it('should display the errors and keep the entered values', () => {
          cy.get('#telephone-number-error').should(
            'contain',
            'Enter a telephone number, like 01632 960 001, 07700 900 982 or +44 0808 157 0192'
          )
          cy.get('#email-error').should('contain', 'Enter a real email address')
          cy.get('#telephone-number').should('have.value', 'abc')
          cy.get('#email').should('have.value', 'not-an-email')
        })
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

      it('should return a 404 when attempting to view responsible contact details', () => {
        cy.request({
          url: RESPONSIBLE_PERSON_CONTACT_DETAILS_PATH,
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

      it('should return a 404 when attempting view responsible contact details', () => {
        cy.request({
          url: RESPONSIBLE_PERSON_CONTACT_DETAILS_PATH,
          failOnStatusCode: false,
        }).then((response) => {
          expect(response.status).to.eq(404)
        })
      })
    })
  })
})
