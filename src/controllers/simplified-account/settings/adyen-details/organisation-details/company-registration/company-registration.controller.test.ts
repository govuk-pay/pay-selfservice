import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import { GatewayAccountFixture } from '@test/fixtures/gateway-account/gateway-account.fixture'
import { PaymentProvider } from '@models/constants/payment-provider'
import { UserFixture } from '@test/fixtures/user/user.fixture'
import { ServiceFixture } from '@test/fixtures/service/service.fixture'
import { MerchantDetailsFixture } from '@test/fixtures/service/merchant-details.fixture'
import sinon from 'sinon'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { OrganisationDetailsSession } from '../constants'

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

const TEMPLATE_PATH = 'simplified-account/settings/adyen-details/company-registration/company-registration-number'

const { res, call, nextRequest } = new ControllerTestBuilder(
  '@controllers/simplified-account/settings/adyen-details/organisation-details/company-registration/company-registration.controller'
)
  .withService(serviceFixture.toService())
  .withServiceExternalId(SERVICE_EXTERNAL_ID)
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
  vatRegistrationNumber: 'GB123456789',
  hasCompanyRegistrationNumber: 'true',
  governmentActivity: 'general-local',
}

describe('Controller: settings/adyen-details/organisation-details/company-registration/company-registration', () => {
  describe('get', () => {
    describe('with no organisation details in session', () => {
      beforeEach(async () => {
        nextRequest({ session: {} })
        await call('get')
      })

      it('should redirect to the switch to adyen task list', () => {
        sinon.assert.calledOnce(res.redirect)
        sinon.assert.calledWith(res.redirect, sinon.match(/switch-to-adyen/))
      })
    })

    describe('with organisation details already in session', () => {
      beforeEach(async () => {
        nextRequest({
          session: {
            otherSessionData: 'keep',
            pageData: {
              organisationDetails: {
                ...VALID_SESSION,
                companyRegistrationNumber: '01234567',
              },
            },
          },
        })
        await call('get')
      })

      it('should call the response function with the template path', () => {
        mockResponse.should.have.been.calledOnce
        mockResponse.should.have.been.calledWith(sinon.match.any, sinon.match.any, TEMPLATE_PATH)
      })

      it('should call the response method with the companyRegistrationNumber and backLink', () => {
        mockResponse.should.have.been.calledOnce
        const context = mockResponse.firstCall.lastArg as { companyRegistrationNumber: string; backLink: string }
        sinon.assert.match(context, {
          companyRegistrationNumber: '01234567',
          backLink: formatServiceAndAccountPathsFor(
            paths.simplifiedAccount.settings.adyenDetails.organisationDetails.hasCompanyRegistration,
            SERVICE_EXTERNAL_ID,
            SERVICE_TYPE,
            GATEWAY_ACCOUNT.getSwitchingCredential().externalId
          ),
        })
      })
    })
  })

  describe('post', () => {
    const UPDATED_SESSION = new OrganisationDetailsSession({
      ...VALID_SESSION,
      companyRegistrationNumber: '01234567',
    })
    beforeEach(() => {
      nextRequest({
        body: { companyRegistrationNumber: '01234567' },
        session: {
          otherSessionData: 'keep',
          pageData: {
            organisationDetails: VALID_SESSION,
          },
        },
      })
    })

    it('should redirect to the task list page', async () => {
      await call('post')
      sinon.assert.calledOnceWithExactly(
        res.redirect,
        formatServiceAndAccountPathsFor(
          paths.simplifiedAccount.settings.switchPsp.switchToAdyen.index,
          SERVICE_EXTERNAL_ID,
          SERVICE_TYPE,
          GATEWAY_ACCOUNT.getSwitchingCredential().externalId
        )
      )
    })
    it('should create Adyen legal entity and mark organisation details task as complete', async () => {
      await call('post')

      sinon.assert.calledOnceWithExactly(
        createOrganisation,
        UPDATED_SESSION,
        serviceFixture.toService(),
        GATEWAY_ACCOUNT.type,
        GATEWAY_ACCOUNT.getSwitchingCredential().externalId,
        USER.externalId
      )

      sinon.assert.calledOnceWithExactly(
        setAdyenStoreId,
        SERVICE_EXTERNAL_ID,
        SERVICE_TYPE,
        GATEWAY_ACCOUNT.getSwitchingCredential().externalId,
        USER.externalId,
        'ST123'
      )

      sinon.assert.calledOnceWithExactly(
        markTaskAsComplete,
        SERVICE_EXTERNAL_ID,
        SERVICE_TYPE,
        GATEWAY_ACCOUNT.getSwitchingCredential().externalId,
        'organisationDetails'
      )

      sinon.assert.callOrder(
        getStripeStatementDescriptor,
        createOrganisation,
        createStore,
        setAdyenStoreId,
        markTaskAsComplete
      )
    })

    it('should create a store for the business line using the Stripe statement descriptor', async () => {
      await call('post')

      sinon.assert.calledOnceWithExactly(getStripeStatementDescriptor, GATEWAY_ACCOUNT)
      sinon.assert.calledOnceWithExactly(createStore, {
        businessLineId: 'BL123',
        balanceAccountId: 'BA123',
        serviceName: serviceFixture.name,
        statementDescriptor: 'TEST SERVICE',
        telephoneNumber: TELEPHONE_NUMBER,
        organisationDetails: UPDATED_SESSION,
      })
    })
  })
})
