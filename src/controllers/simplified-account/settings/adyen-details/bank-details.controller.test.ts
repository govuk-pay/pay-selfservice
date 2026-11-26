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
const createBankDetails = sinon.stub().resolves()

const { req, res, call, nextRequest } = new ControllerTestBuilder(
  '@controllers/simplified-account/settings/adyen-details/bank-details.controller'
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
    '@services/adyen-details.service': { createBankDetails },
  })
  .build()

describe('Controller: settings/adyen-details/bank-details', () => {
  describe('get', () => {
    it('should call the response function with req, res, and the template path', async () => {
      await call('get')

      mockResponse.should.have.been.calledOnce
      mockResponse.should.have.been.calledWith(req, res, 'simplified-account/settings/adyen-details/bank-details')
    })

    it('should call the response method with the backLink', async () => {
      await call('get')

      mockResponse.should.have.been.calledOnce
      const context = mockResponse.firstCall.lastArg as { backLink: string }
      sinon.assert.match(context, {
        backLink: formatServiceAndAccountPathsFor(
          paths.simplifiedAccount.settings.switchPsp.switchToAdyen.index,
          SERVICE_EXTERNAL_ID,
          SERVICE_TYPE
        ),
      })
    })
  })
  describe('post', () => {
    afterEach(() => {
      sinon.resetHistory()
    })

    describe('with valid bank details', () => {
      it('should create the bank details', async () => {
        nextRequest({
          body: {
            sortCode: '01-01-02',
            accountNumber: '123456',
          },
        })

        await call('post')

        sinon.assert.calledOnceWithExactly(
          createBankDetails,
          sinon.match({ sortCode: '010102', accountNumber: '123456' }),
          SERVICE_EXTERNAL_ID,
          SERVICE_TYPE,
          GATEWAY_ACCOUNT.getSwitchingCredential().externalId
        )
      })

      it('should complete the bank details task and redirect to the switch to adyen task list', async () => {
        nextRequest({
          body: {
            sortCode: '090102',
            accountNumber: '00000123',
          },
        })

        await call('post')
        sinon.assert.calledOnceWithExactly(
          markTaskAsComplete,
          SERVICE_EXTERNAL_ID,
          SERVICE_TYPE,
          GATEWAY_ACCOUNT.getSwitchingCredential().externalId,
          'bankDetails'
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

    describe('with empty bank details', () => {
      beforeEach(async () => {
        nextRequest({ body: { sortCode: '', accountNumber: '' } })
        await call('post')
      })

      it('should not create the bank details, complete the task or redirect', () => {
        sinon.assert.notCalled(createBankDetails)
        sinon.assert.notCalled(markTaskAsComplete)
        sinon.assert.notCalled(res.redirect)
      })

      it('should show the page with an error for every field', () => {
        mockResponse.should.have.been.calledOnce
        mockResponse.should.have.been.calledWith(
          sinon.match.any,
          sinon.match.any,
          'simplified-account/settings/adyen-details/bank-details'
        )
        sinon.assert.match(mockResponse.firstCall.lastArg, {
          errors: {
            summary: [
              { text: 'Enter a sort code', href: '#sort-code' },
              { text: 'Enter an account number', href: '#account-number' },
            ],
            formErrors: {
              sortCode: 'Enter a sort code',
              accountNumber: 'Enter an account number',
            },
          },
          sortCode: '',
          accountNumber: '',
          backLink: formatServiceAndAccountPathsFor(
            paths.simplifiedAccount.settings.switchPsp.switchToAdyen.index,
            SERVICE_EXTERNAL_ID,
            SERVICE_TYPE
          ),
        })
      })
    })

    describe('with an invalid account number', () => {
      beforeEach(async () => {
        nextRequest({ body: { sortCode: '010102', accountNumber: '12345' } })
        await call('post')
      })

      it('should not create the bank details', () => {
        sinon.assert.notCalled(createBankDetails)
      })

      it('should render the template with the error and the submitted values', () => {
        sinon.assert.match(mockResponse.firstCall.lastArg, {
          errors: {
            formErrors: { accountNumber: 'Account number must be between 6 and 8 digits long' },
          },
          sortCode: '010102',
          accountNumber: '12345',
        })
      })
    })
  })
})
