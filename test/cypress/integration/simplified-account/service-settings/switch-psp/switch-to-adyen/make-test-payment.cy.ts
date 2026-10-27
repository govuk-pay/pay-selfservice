import { UserFixture } from '@test/fixtures/user/user.fixture'
import { ServiceFixture } from '@test/fixtures/service/service.fixture'
import { GatewayAccountFixture } from '@test/fixtures/gateway-account/gateway-account.fixture'
import { PaymentProvider } from '@models/constants/payment-provider'
import { getUser } from '@test/cypress/stubs/simplified-account/user-stubs'
import * as SimplifiedGatewayAccountStubs from '@test/cypress/stubs/simplified-account/gateway-account-stubs'
import gatewayAccountStubs from '@test/cypress/stubs/gateway-account-stubs'
import checkTitleAndHeading from '../../helpers/check-title-and-heading'
import connectorChargeStubs from '@test/cypress/stubs/connector-charge-stubs'
import { VERIFY_PSP_INTEGRATION_CHARGE_EXTERNAL_ID_KEY } from '@utils/verify-psp-integration'
import { VERIFIED } from '@models/constants/credential-state'
import * as AdyenStubs from '@test/cypress/stubs/simplified-account/adyen-psp-stubs'
import { AdyenAccountSetupFixture } from '@test/fixtures/gateway-account/adyen-account-setup.fixture'
import { CredentialFixture } from '@test/fixtures/gateway-account/credential.fixture'

const USER_EXTERNAL_ID = 'user-123-abc'
const SERVICE_EXTERNAL_ID = 'service456def'
const LIVE_ACCOUNT_TYPE = 'live'
const GATEWAY_ACCOUNT_ID = 12
const ADYEN_CREDENTIAL_EXTERNAL_ID = 'adyen-credential-123-abc'
const SWITCH_TO_ADYEN_MAKE_A_PAYMENT_TASK_INFO_URL = `/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/switch-psp/make-a-payment`
const SWITCH_TO_ADYEN_MAKE_A_PAYMENT_TASK_RETURN_URL = `/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/switch-psp/make-a-payment/verify`
const CHARGE_EXTERNAL_ID = 'charge-456-def'

const gatewayAccountFixture = GatewayAccountFixture.forSwitchingPsp(
  PaymentProvider.STRIPE,
  PaymentProvider.ADYEN,
  [],
  [
    {
      externalId: ADYEN_CREDENTIAL_EXTERNAL_ID,
      credentials: CredentialFixture.forAdyen({ accountHolderId: 'account-holder-123' }),
    },
  ],
  {
    id: GATEWAY_ACCOUNT_ID,
    serviceId: SERVICE_EXTERNAL_ID,
  }
)
const serviceFixture = new ServiceFixture({
  externalId: SERVICE_EXTERNAL_ID,
  gatewayAccountIds: [`${gatewayAccountFixture.id}`],
  currentGoLiveStage: 'LIVE',
})
const userFixture = UserFixture.asServiceAdmin([serviceFixture], { externalId: USER_EXTERNAL_ID })

const adyenAccountSetup = AdyenAccountSetupFixture.Completed({
  serviceExternalId: SERVICE_EXTERNAL_ID,
  credentialExternalId: ADYEN_CREDENTIAL_EXTERNAL_ID,
})

const setStubs = (additionalStubs: object[] = []) => {
  cy.task('setupStubs', [
    getUser(USER_EXTERNAL_ID).success(userFixture),
    SimplifiedGatewayAccountStubs.getByServiceExternalIdAndAccountType(SERVICE_EXTERNAL_ID, LIVE_ACCOUNT_TYPE).success(
      gatewayAccountFixture
    ),
    SimplifiedGatewayAccountStubs.getAdyenSetupTasks(
      SERVICE_EXTERNAL_ID,
      LIVE_ACCOUNT_TYPE,
      ADYEN_CREDENTIAL_EXTERNAL_ID,
      adyenAccountSetup.toAdyenAccountSetupData().tasks
    ).success(),
    AdyenStubs.getAccountHolder('account-holder-123').success({ id: 'account-holder-123', legalEntityId: 'LE-456' }),
    ...additionalStubs,
  ])
}

describe('make a live payment task', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID, {
      [VERIFY_PSP_INTEGRATION_CHARGE_EXTERNAL_ID_KEY]: CHARGE_EXTERNAL_ID,
    })
  })

  it('accessibility check', () => {
    setStubs()

    cy.visit(SWITCH_TO_ADYEN_MAKE_A_PAYMENT_TASK_INFO_URL)
    cy.a11yCheck()
  })

  it('should display correct page title and headings', () => {
    setStubs()

    cy.visit(SWITCH_TO_ADYEN_MAKE_A_PAYMENT_TASK_INFO_URL)

    checkTitleAndHeading(`Make a £1 payment using a debit or credit card`, gatewayAccountFixture.serviceName)
  })

  it('should redirect the user to complete a payment', () => {
    setStubs([
      connectorChargeStubs.postChargeRequestSuccessByServiceExternalIdAndAccountType({
        serviceExternalId: SERVICE_EXTERNAL_ID,
        accountType: LIVE_ACCOUNT_TYPE,
        chargeExternalId: CHARGE_EXTERNAL_ID,
        nextUrl: 'https://notfrontend.gov.uk',
      }),
    ])

    cy.visit(SWITCH_TO_ADYEN_MAKE_A_PAYMENT_TASK_INFO_URL)
    cy.intercept('https://notfrontend.gov.uk', {
      statusCode: 200,
    }).as('frontendCall')

    cy.get('#make-a-payment-submit').click()

    cy.wait('@frontendCall').then((interception) => {
      expect(interception.request).to.not.equal(undefined)
      expect(interception.request.method).to.equal('GET')
      expect(interception.response?.statusCode).to.equal(200)
    })
  })

  it('should be redirected back to the tasks index with a success message', () => {
    setStubs([
      connectorChargeStubs.getChargeSuccessByServiceExternalIdAndAccountType({
        serviceExternalId: SERVICE_EXTERNAL_ID,
        accountType: LIVE_ACCOUNT_TYPE,
        chargeExternalId: CHARGE_EXTERNAL_ID,
      }),
      gatewayAccountStubs.patchUpdateCredentialsSuccessByServiceExternalIdAndType(
        SERVICE_EXTERNAL_ID,
        LIVE_ACCOUNT_TYPE,
        ADYEN_CREDENTIAL_EXTERNAL_ID,
        {
          path: 'state',
          value: VERIFIED,
          userExternalId: USER_EXTERNAL_ID,
        }
      ),
    ])
    cy.visit(SWITCH_TO_ADYEN_MAKE_A_PAYMENT_TASK_RETURN_URL)
    cy.get('.govuk-notification-banner')
      .should('have.class', 'govuk-notification-banner--success')
      .should('have.class', 'system-messages')
      .contains('Payment verified')
      .parent()
      .parent()
      .contains('This service is ready to switch to Adyen')
  })

  it('should be redirected back to the tasks index with an error message', () => {
    setStubs([
      connectorChargeStubs.getChargeSuccessByServiceExternalIdAndAccountType({
        serviceExternalId: SERVICE_EXTERNAL_ID,
        accountType: LIVE_ACCOUNT_TYPE,
        chargeExternalId: CHARGE_EXTERNAL_ID,
        status: 'cancelled',
      }),
    ])
    cy.visit(SWITCH_TO_ADYEN_MAKE_A_PAYMENT_TASK_RETURN_URL)
    cy.get('.govuk-notification-banner')
      .should('have.class', 'govuk-notification-banner--error')
      .should('have.class', 'system-messages')
      .contains('There is a problem')
      .parent()
      .parent()
      .contains(
        'The payment has failed, please try again. If you need help, contact govuk-pay-support@digital.cabinet-office.gov.uk'
      )
  })
})
