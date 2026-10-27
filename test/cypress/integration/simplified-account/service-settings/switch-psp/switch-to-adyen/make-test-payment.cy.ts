import { UserFixture } from '@test/fixtures/user/user.fixture'
import { ServiceFixture } from '@test/fixtures/service/service.fixture'
import { GatewayAccountFixture } from '@test/fixtures/gateway-account/gateway-account.fixture'
import { PaymentProvider } from '@models/constants/payment-provider'
import { getUser } from '@test/cypress/stubs/simplified-account/user-stubs'
import * as GatewayAccountStubs from '@test/cypress/stubs/simplified-account/gateway-account-stubs'
import {
  AdyenAccountSetupTaskData,
  AdyenAccountSetupTaskNameData,
} from '@models/gateway-account/dto/AdyenAccountSetup.dto'
import checkTitleAndHeading from '../../helpers/check-title-and-heading'
import connectorChargeStubs from '@test/cypress/stubs/connector-charge-stubs'
import { VERIFY_PSP_INTEGRATION_CHARGE_EXTERNAL_ID_KEY } from '@utils/verify-psp-integration'
import { VERIFIED } from '@models/constants/credential-state'

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

const tasksWithStatus: Record<AdyenAccountSetupTaskNameData, AdyenAccountSetupTaskData> = {
  bank_details: {
    status: 'COMPLETED',
  },
  director: {
    status: 'COMPLETED',
  },
  responsible_person: {
    status: 'COMPLETED',
  },
  legal_terms: {
    status: 'COMPLETED',
  },
  organisation_details: {
    status: 'COMPLETED',
  },
}

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
      tasksWithStatus
    ).success(),
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
      GatewayAccountStubs.patchUpdateCredentialsSuccessByServiceExternalIdAndType(
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
