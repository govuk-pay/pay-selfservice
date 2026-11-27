import { UserFixture } from '@test/fixtures/user/user.fixture'
import { ServiceFixture } from '@test/fixtures/service/service.fixture'
import { GatewayAccountFixture } from '@test/fixtures/gateway-account/gateway-account.fixture'
import { PaymentProvider } from '@models/constants/payment-provider'
import { getUser } from '@test/cypress/stubs/simplified-account/user-stubs'
import * as GatewayAccountStubs from '@test/cypress/stubs/simplified-account/gateway-account-stubs'
import { checkServiceNavigation } from '@test/cypress/integration/simplified-account/common/assertions'

const USER_EXTERNAL_ID = 'user-123-abc'
const SERVICE_EXTERNAL_ID = 'service456def'
const LIVE_ACCOUNT_TYPE = 'live'
const GATEWAY_ACCOUNT_ID = 12
const ADYEN_CREDENTIAL_EXTERNAL_ID = 'adyen-credential-123-abc'

const TASK_LIST_PATH = `/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/switch-psp/switch-to-adyen`
const RESPONSIBLE_PERSON_DETAILS_PATH = `/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/adyen-details/${ADYEN_CREDENTIAL_EXTERNAL_ID}/responsible-person/details`
const RESPONSIBLE_PERSON_ADDRESS_PATH = `/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/adyen-details/${ADYEN_CREDENTIAL_EXTERNAL_ID}/responsible-person/address`

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

const setStubs = (additionalStubs = []) => {
  cy.task('setupStubs', [
    getUser(USER_EXTERNAL_ID).success(userFixture),
    GatewayAccountStubs.getByServiceExternalIdAndAccountType(SERVICE_EXTERNAL_ID, LIVE_ACCOUNT_TYPE).success(
      gatewayAccountFixture
    ),
    ...additionalStubs,
  ])
}

describe(`Responsible person - personal details`, () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })

  describe('for a service that is migrating to adyen', () => {
    it('should display the page correctly', () => {
      setStubs()

      cy.visit(RESPONSIBLE_PERSON_DETAILS_PATH)

      cy.a11yCheck()
      cy.get('.govuk-back-link').should('have.attr', 'href', TASK_LIST_PATH)

      checkServiceNavigation('Switch provider to Adyen now', TASK_LIST_PATH)
      cy.get('h1').should('contain.text', `Responsible person’s personal details`)

      cy.get('#first-name').should('exist')
      cy.get('#last-name').should('exist')

      cy.get('#dob-day').should('exist')
      cy.get('#dob-month').should('exist')
      cy.get('#dob-year').should('exist')

      cy.log('Should display page correctly when there are errors')

      const expectedErrors = [
        { field: '#first-name', message: 'Enter the responsible person’s first name' },
        { field: '#last-name', message: 'Enter the responsible person’s last name' },
        { field: '#dob-day', message: 'Enter the date of birth' },
      ]

      cy.visit(RESPONSIBLE_PERSON_DETAILS_PATH)
      cy.get('#responsible-person-details-submit').click()

      cy.log('the page title has error prefix')
      cy.title().should('match', /^Error: Responsible person’s personal details - /)

      cy.log('the error summary is present')
      cy.get('.govuk-error-summary').should('be.visible').and('contain', 'There is a problem')

      cy.log('the correct errors are shown')

      cy.get('.govuk-error-summary__list li').should('have.length', expectedErrors.length)
      expectedErrors.forEach(({ field, message }, index) => {
        cy.get('.govuk-error-summary__list li').eq(index).find(`a[href="${field}"]`).should('contain', message)
      })

      cy.location('pathname').should('eq', RESPONSIBLE_PERSON_DETAILS_PATH)

      cy.log('should redirect to the responsible person address page when continue is pressed')

      cy.get('#first-name').type('John')
      cy.get('#last-name').type('McClane')

      cy.get('#dob-day').type('25')
      cy.get('#dob-month').type('12')
      cy.get('#dob-year').type('1960')

      cy.get('#responsible-person-details-submit').click()

      cy.location('pathname').should('eq', RESPONSIBLE_PERSON_ADDRESS_PATH)
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

      it('should return a 404 when attempting to view responsible person details', () => {
        cy.request({
          url: RESPONSIBLE_PERSON_DETAILS_PATH,
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

      it('should return a 404 when attempting to responsible person details', () => {
        cy.request({
          url: RESPONSIBLE_PERSON_DETAILS_PATH,
          failOnStatusCode: false,
        }).then((response) => {
          expect(response.status).to.eq(404)
        })
      })
    })
  })
})
