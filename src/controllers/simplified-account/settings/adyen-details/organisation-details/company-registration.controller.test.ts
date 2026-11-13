import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import { GatewayAccountFixture } from '@test/fixtures/gateway-account/gateway-account.fixture'
import { PaymentProvider } from '@models/constants/payment-provider'
import { UserFixture } from '@test/fixtures/user/user.fixture'
import { ServiceFixture } from '@test/fixtures/service/service.fixture'
import sinon from 'sinon'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'

const SERVICE_EXTERNAL_ID = 'service123'
const SERVICE_TYPE = 'live'
const serviceFixture = new ServiceFixture({
  externalId: SERVICE_EXTERNAL_ID,
})
const GATEWAY_ACCOUNT = GatewayAccountFixture.forSwitchingPsp(PaymentProvider.STRIPE, PaymentProvider.ADYEN, [], [], {
  type: 'live',
}).toGatewayAccount()

const TEMPLATE_PATH = 'simplified-account/settings/adyen-details/company-registration-number'

const mockResponse = sinon.stub()

const { res, call, nextRequest } = new ControllerTestBuilder(
  '@controllers/simplified-account/settings/adyen-details/organisation-details/company-registration.controller'
)
  .withServiceExternalId(SERVICE_EXTERNAL_ID)
  .withAccount(GATEWAY_ACCOUNT)
  .withUser(UserFixture.asServiceAdmin([serviceFixture]).toUser())
  .withStubs({
    '@utils/response': { response: mockResponse },
  })
  .build()

describe('Controller: settings/adyen-details/organisation-details/company-registration', () => {
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
            pageData: {
              organisationDetails: {
                organisationName: 'Test Organisation',
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
            paths.simplifiedAccount.settings.adyenDetails.organisationDetails.index,
            SERVICE_EXTERNAL_ID,
            SERVICE_TYPE,
            GATEWAY_ACCOUNT.getSwitchingCredential().externalId
          ),
        })
      })
    })
  })

  describe('post', () => {
    const session = {
      pageData: {
        organisationDetails: {
          organisationName: 'Test Organisation',
        },
      },
    }

    describe('with a valid company registration number', () => {
      beforeEach(async () => {
        nextRequest({ body: { companyRegistrationNumber: '12345678' }, session })
        await call('post')
      })

      it('should redirect to the VAT registration number page with a valid registration number', () => {
        sinon.assert.calledOnceWithExactly(
          res.redirect,
          formatServiceAndAccountPathsFor(
            paths.simplifiedAccount.settings.adyenDetails.organisationDetails.vatRegistration,
            SERVICE_EXTERNAL_ID,
            SERVICE_TYPE,
            GATEWAY_ACCOUNT.getSwitchingCredential().externalId
          )
        )
      })
    })

    describe('with an empty company registration number', () => {
      beforeEach(async () => {
        nextRequest({ body: { companyRegistrationNumber: '' }, session })
        await call('post')
      })

      it('should not redirect', () => {
        sinon.assert.notCalled(res.redirect)
      })

      it('should show the error and backLink', () => {
        mockResponse.should.have.been.calledOnce
        mockResponse.should.have.been.calledWith(sinon.match.any, sinon.match.any, TEMPLATE_PATH)
        const context = mockResponse.firstCall.lastArg as {
          errors: { summary: { text: string; href: string }[]; formErrors: Record<string, string> }
          companyRegistrationNumber: string
          backLink: string
        }
        sinon.assert.match(context, {
          errors: {
            summary: [{ text: 'Enter a company registration number', href: '#company-registration-number' }],
            formErrors: { companyRegistrationNumber: 'Enter a company registration number' },
          },
          companyRegistrationNumber: '',
          backLink: formatServiceAndAccountPathsFor(
            paths.simplifiedAccount.settings.adyenDetails.organisationDetails.index,
            SERVICE_EXTERNAL_ID,
            SERVICE_TYPE,
            GATEWAY_ACCOUNT.getSwitchingCredential().externalId
          ),
        })
      })
    })

    describe('with a company registration number that is not 8 characters', () => {
      beforeEach(async () => {
        nextRequest({ body: { companyRegistrationNumber: '12345' }, session })
        await call('post')
      })

      it('should not redirect', () => {
        sinon.assert.notCalled(res.redirect)
      })

      it('should show the error and the submitted value', () => {
        mockResponse.should.have.been.calledOnce
        const context = mockResponse.firstCall.lastArg as {
          errors: { formErrors: Record<string, string> }
          companyRegistrationNumber: string
        }
        sinon.assert.match(context, {
          errors: {
            formErrors: { companyRegistrationNumber: 'Company registration number must be 8 characters long' },
          },
          companyRegistrationNumber: '12345',
        })
      })
    })
  })
})
