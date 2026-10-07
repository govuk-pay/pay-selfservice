import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import { GatewayAccountFixture } from '@test/fixtures/gateway-account/gateway-account.fixture'
import { PaymentProvider } from '@models/constants/payment-provider'
import { UserFixture } from '@test/fixtures/user/user.fixture'
import { ServiceFixture } from '@test/fixtures/service/service.fixture'
import sinon from 'sinon'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'

const SERVICE_EXTERNAL_ID = 'service123abc'
const SERVICE_TYPE = 'live'
const serviceFixture = new ServiceFixture({
  externalId: SERVICE_EXTERNAL_ID,
})

const GATEWAY_ACCOUNT = GatewayAccountFixture.forSwitchingPsp(PaymentProvider.STRIPE, PaymentProvider.ADYEN, [], [], {
  type: 'live',
}).toGatewayAccount()

const mockResponse = sinon.stub()
const markTaskAsComplete = sinon.stub().resolves()

const TEMPLATE = 'simplified-account/settings/adyen-details/reason-for-taking-payments'
const BACK_LINK = formatServiceAndAccountPathsFor(
  paths.simplifiedAccount.settings.adyenDetails.organisationDetails.vatRegistration,
  SERVICE_EXTERNAL_ID,
  SERVICE_TYPE,
  GATEWAY_ACCOUNT.getSwitchingCredential().externalId
)

const { req, res, call, nextRequest } = new ControllerTestBuilder(
  '@controllers/simplified-account/settings/adyen-details/organisation-details/reason-for-taking-payments.controller.ts'
)
  .withServiceExternalId(SERVICE_EXTERNAL_ID)
  .withAccount(
    GatewayAccountFixture.forSwitchingPsp(PaymentProvider.STRIPE, PaymentProvider.ADYEN, [], [], {
      type: 'live',
    }).toGatewayAccount()
  )
  .withUser(UserFixture.asServiceAdmin([serviceFixture]).toUser())
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/adyen-setup.service': { markTaskAsComplete },
  })
  .build()

describe('Controller: settings/adyen-details/reason-for-taking-payments', () => {
  describe('get', () => {
    it('should call the response function with req, res, and the template path', async () => {
      await call('get')

      mockResponse.should.have.been.calledOnce
      mockResponse.should.have.been.calledWith(req, res, TEMPLATE)
    })

    it('should call the response method with the backLink', async () => {
      await call('get')

      mockResponse.should.have.been.calledOnce
      const context = mockResponse.firstCall.lastArg as { backLink: string }
      sinon.assert.match(context, {
        backLink: BACK_LINK,
      })
    })
  })
  describe('post', () => {
    describe('when a selection is made', () => {
      beforeEach(() => {
        res.redirect.resetHistory()
        nextRequest({
          body: {
            takingPaymentsFor: 'government-activities',
          },
        })
      })
      it('should mark organisation details task as complete and redirect to the switch to adyen task list', async () => {
        await call('post')
        sinon.assert.calledOnceWithExactly(
          markTaskAsComplete,
          SERVICE_EXTERNAL_ID,
          SERVICE_TYPE,
          GATEWAY_ACCOUNT.getSwitchingCredential().externalId,
          'organisationDetails'
        )
        sinon.assert.calledOnceWithExactly(
          res.redirect,
          formatServiceAndAccountPathsFor(
            paths.simplifiedAccount.settings.switchPsp.switchToAdyen.index,
            SERVICE_EXTERNAL_ID,
            SERVICE_TYPE
          )
        )
      })
    })
    describe('when no selection is made', () => {
      beforeEach(async () => {
        mockResponse.resetHistory()
        res.redirect.resetHistory()
        nextRequest({
          body: {},
        })

        await call('post')
      })
      it('should not complete the task or redirect', () => {
        sinon.assert.notCalled(markTaskAsComplete)
        sinon.assert.notCalled(res.redirect as sinon.SinonStub)
      })
      it('should re-render the taking payments for page with the backLink', () => {
        sinon.assert.calledOnce(mockResponse)
        sinon.assert.calledWithMatch(mockResponse, req, res, TEMPLATE)
        const context = mockResponse.firstCall.lastArg as { backLink: string }
        sinon.assert.match(context, { backLink: BACK_LINK })
      })
      it('should show the summary error', () => {
        const context = mockResponse.firstCall.lastArg as {
          errors: { summary: { text: string; href: string }[] }
        }
        sinon.assert.match(context.errors.summary, [
          {
            text: 'You must make a selection',
            href: '#taking-payments-for',
          },
        ])
      })
    })
  })
})
