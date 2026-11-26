import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import { GatewayAccountFixture } from '@test/fixtures/gateway-account/gateway-account.fixture'
import { PaymentProvider } from '@models/constants/payment-provider'
import { UserFixture } from '@test/fixtures/user/user.fixture'
import { ServiceFixture } from '@test/fixtures/service/service.fixture'
import sinon from 'sinon'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { OrganisationDetailsSession } from './constants'

const SERVICE_EXTERNAL_ID = 'service123'
const SERVICE_TYPE = 'live'
const serviceFixture = new ServiceFixture({
  externalId: SERVICE_EXTERNAL_ID,
})
const GATEWAY_ACCOUNT = GatewayAccountFixture.forSwitchingPsp(PaymentProvider.STRIPE, PaymentProvider.ADYEN, [], [], {
  type: 'live',
}).toGatewayAccount()
const USER = UserFixture.asServiceAdmin([serviceFixture], { externalId: 'user123abc' }).toUser()

const mockResponse = sinon.stub()

const TEMPLATE = 'simplified-account/settings/adyen-details/organisation-details-review'
const BACK_LINK = formatServiceAndAccountPathsFor(
  paths.simplifiedAccount.settings.adyenDetails.organisationDetails.index,
  SERVICE_EXTERNAL_ID,
  SERVICE_TYPE,
  GATEWAY_ACCOUNT.getSwitchingCredential().externalId
)

const { req, res, call, nextRequest } = new ControllerTestBuilder(
  '@controllers/simplified-account/settings/adyen-details/organisation-details/organisation-details-review.controller.ts'
)
  .withService(serviceFixture.toService())
  .withAccount(GATEWAY_ACCOUNT)
  .withUser(USER)
  .withStubs({
    '@utils/response': { response: mockResponse },
  })
  .build()

const VALID_SESSION: Partial<OrganisationDetailsSession> = {
  organisationName: 'Test Organisation',
  addressLine1: '1 Test Street',
  addressCity: 'swansea',
  addressPostcode: 'T3 5TT',
  addressCountry: 'GB',
}

describe('Controller: settings/adyen-details/organisation-details/organisation-details-review', () => {
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
            paths.simplifiedAccount.settings.adyenDetails.organisationDetails.vatRegistrationNumber,
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
        mockResponse.should.have.been.calledWith(sinon.match.any, sinon.match.any, TEMPLATE)
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
