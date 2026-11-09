import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import { GatewayAccountFixture } from '@test/fixtures/gateway-account/gateway-account.fixture'
import { PaymentProvider } from '@models/constants/payment-provider'
import { UserFixture } from '@test/fixtures/user/user.fixture'
import { ServiceFixture } from '@test/fixtures/service/service.fixture'
import { MerchantDetailsFixture } from '@test/fixtures/service/merchant-details.fixture'
import sinon from 'sinon'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { OrganisationDetailsSession } from './constants'

const SERVICE_EXTERNAL_ID = 'service123abc'
const SERVICE_TYPE = 'live'
const TELEPHONE_NUMBER = '01234 567890'
const serviceFixture = new ServiceFixture({
  externalId: SERVICE_EXTERNAL_ID,
  merchantDetails: new MerchantDetailsFixture({
    telephoneNumber: TELEPHONE_NUMBER,
  }),
})

const GATEWAY_ACCOUNT = GatewayAccountFixture.forSwitchingPsp(PaymentProvider.STRIPE, PaymentProvider.ADYEN, [], [], {
  type: 'live',
}).toGatewayAccount()
const USER = UserFixture.asServiceAdmin([serviceFixture], { externalId: 'user123abc' }).toUser()

const mockResponse = sinon.stub()
const createOrganisation = sinon.stub().resolves({
  legalEntity: { id: 'LE123' },
  businessLine: { id: 'BL123' },
  accountHolder: { id: 'AH123' },
  balanceAccount: { id: 'BA123' },
})
const createStore = sinon.stub().resolves({ id: 'ST123' })
const getStripeStatementDescriptor = sinon.stub().resolves('TEST SERVICE')
const markTaskAsComplete = sinon.stub().resolves()
const setAdyenStoreId = sinon.stub().resolves()

const TEMPLATE = 'simplified-account/settings/adyen-details/not-registered-for-vat'
const BACK_LINK = formatServiceAndAccountPathsFor(
  paths.simplifiedAccount.settings.adyenDetails.organisationDetails.registeredForVat,
  SERVICE_EXTERNAL_ID,
  SERVICE_TYPE,
  GATEWAY_ACCOUNT.getSwitchingCredential().externalId
)

const { req, res, call, nextRequest } = new ControllerTestBuilder(
  '@controllers/simplified-account/settings/adyen-details/organisation-details/not-registered-for-vat.controller.ts'
)
  .withService(serviceFixture.toService())
  .withAccount(GATEWAY_ACCOUNT)
  .withUser(USER)
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/adyen-details.service': { createOrganisation, createStore, setAdyenStoreId },
    '@services/stripe-details.service': { getStripeStatementDescriptor },
    '@services/adyen-setup.service': { markTaskAsComplete },
  })
  .build()

const VALID_SESSION: Partial<OrganisationDetailsSession> = {
  organisationName: 'Test Organisation',
  addressLine1: '1 Test Street',
  addressCity: 'swansea',
  addressPostcode: 'T3 5TT',
  addressCountry: 'GB',
  hasCompanyRegistrationNumber: 'true',
}

describe('Controller: settings/adyen-details/not-registered-for-vat', () => {
  describe('get', () => {
    describe('with no organisation details in session', () => {
      beforeEach(async () => {
        nextRequest({ session: {} })
        await call('get')
      })

      it('should redirect to the switch to adyen task list', () => {
        sinon.assert.calledOnceWithMatch(res.redirect, sinon.match(/switch-to-adyen/))
      })
    })

    describe('with organisation details already in session', () => {
      beforeEach(async () => {
        nextRequest({
          session: {
            pageData: {
              organisationDetails: VALID_SESSION,
            },
          },
        })
        await call('get')
      })

      it('should call the response function with the template path', () => {
        sinon.assert.calledOnceWithMatch(mockResponse, sinon.match.any, sinon.match.any, TEMPLATE)
      })

      it('should call the response method with the backLink', () => {
        const expectedContext = {
          backLink: BACK_LINK,
        }
        sinon.assert.calledOnceWithMatch(mockResponse, req, res, TEMPLATE, expectedContext)
      })
    })
  })
  describe('post', () => {
    describe('when a selection is made', () => {
      beforeEach(() => {
        nextRequest({
          body: {
            notRegisteredForVat: 'exempt',
          },
          session: {
            otherSessionData: 'keep',
            pageData: {
              organisationDetails: VALID_SESSION,
            },
          },
        })
      })
      it('should redirect to the company registration page', async () => {
        const nextPagePath = formatServiceAndAccountPathsFor(
          paths.simplifiedAccount.settings.adyenDetails.organisationDetails.hasCompanyRegistration,
          SERVICE_EXTERNAL_ID,
          SERVICE_TYPE,
          GATEWAY_ACCOUNT.getSwitchingCredential().externalId
        )

        await call('post')
        sinon.assert.calledOnceWithExactly(res.redirect, `${nextPagePath}?from=not-registered`)
      })
    })
  })
})
