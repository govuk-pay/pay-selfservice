import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import { GatewayAccountFixture } from '@test/fixtures/gateway-account/gateway-account.fixture'
import { PaymentProvider } from '@models/constants/payment-provider'
import { UserFixture } from '@test/fixtures/user/user.fixture'
import { ServiceFixture } from '@test/fixtures/service/service.fixture'
import sinon from 'sinon'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { FROM_REVIEW_QUERY_PARAM, ServiceDirectorSession } from './constants'

const SERVICE_EXTERNAL_ID = 'service123abc'
const SERVICE_TYPE = 'live'
const serviceFixture = new ServiceFixture({
  externalId: SERVICE_EXTERNAL_ID,
})
const GATEWAY_ACCOUNT = GatewayAccountFixture.forSwitchingPsp(PaymentProvider.STRIPE, PaymentProvider.ADYEN, [], [], {
  type: 'live',
}).toGatewayAccount()

const mockResponse = sinon.stub()

const { nextRequest, res, call } = new ControllerTestBuilder(
  '@controllers/simplified-account/settings/adyen-details/service-director/service-director-address.controller'
)
  .withServiceExternalId(SERVICE_EXTERNAL_ID)
  .withAccount(GATEWAY_ACCOUNT)
  .withUser(UserFixture.asServiceAdmin([serviceFixture]).toUser())
  .withStubs({
    '@utils/response': { response: mockResponse },
  })
  .build()

describe('Controller: settings/adyen-details/service-director/service-director-address', () => {
  describe('get', () => {
    describe('with empty session data', () => {
      beforeEach(async () => {
        nextRequest({
          session: {},
        })

        await call('get')
      })
      it('should redirect to the Adyen migration task list', () => {
        sinon.assert.calledOnce(res.redirect)
        sinon.assert.calledWith(res.redirect, sinon.match(/switch-to-adyen/))
      })
    })

    describe('with valid session data', () => {
      beforeEach(async () => {
        const currentSession: Partial<ServiceDirectorSession> = {
          firstName: 'Sam',
          lastName: 'Person',
          dobDay: '25',
          dobMonth: '12',
          dobYear: '1970',
          email: 'sam.person@gov.example.com',
          addressLine1: '29 Acacia Road',
          addressCity: 'London',
          addressPostcode: 'W1 2AB',
        }

        nextRequest({
          session: {
            pageData: {
              serviceDirector: currentSession,
            },
          },
        })

        await call('get')
      })
      it('should call the response function with the template path', () => {
        mockResponse.should.have.been.calledOnce
        mockResponse.should.have.been.calledWith(
          sinon.match.any,
          sinon.match.any,
          'simplified-account/settings/adyen-details/service-director/address'
        )
      })

      it('should set form values from session in context', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        const addressValues = context.address as Record<string, unknown>
        sinon.assert.match(addressValues.addressLine1, '29 Acacia Road')
        sinon.assert.match(addressValues.addressCity, 'London')
        sinon.assert.match(addressValues.addressPostcode, 'W1 2AB')
      })

      it('should call the response method with the backLink set to details page', () => {
        mockResponse.should.have.been.calledOnce
        const context = mockResponse.firstCall.lastArg as { backLink: string }
        sinon.assert.match(context, {
          backLink: formatServiceAndAccountPathsFor(
            paths.simplifiedAccount.settings.adyenDetails.serviceDirector.details,
            SERVICE_EXTERNAL_ID,
            SERVICE_TYPE,
            GATEWAY_ACCOUNT.getSwitchingCredential().externalId
          ),
        })
      })
    })

    describe('when user is coming from check your answers page', () => {
      beforeEach(async () => {
        const currentSession: Partial<ServiceDirectorSession> = {
          firstName: 'Sam',
          lastName: 'Person',
          dobDay: '25',
          dobMonth: '12',
          dobYear: '1970',
          email: 'sam.person@gov.example.com',
          addressLine1: '29 Acacia Road',
          addressCity: 'London',
          addressPostcode: 'W1 2AB',
        }

        nextRequest({
          query: { [FROM_REVIEW_QUERY_PARAM]: 'true' },
          session: {
            pageData: {
              serviceDirector: currentSession,
            },
          },
        })

        await call('get')
      })

      it('should call the response method with the backLink set to the check your answers page', () => {
        mockResponse.should.have.been.calledOnce
        const context = mockResponse.firstCall.lastArg as { backLink: string }
        sinon.assert.match(context, {
          backLink: formatServiceAndAccountPathsFor(
            paths.simplifiedAccount.settings.adyenDetails.serviceDirector.checkYourAnswers,
            SERVICE_EXTERNAL_ID,
            SERVICE_TYPE,
            GATEWAY_ACCOUNT.getSwitchingCredential().externalId
          ),
        })
      })
    })
  })
  describe('post', () => {
    beforeEach(async () => {
      res.redirect.resetHistory()

      nextRequest({
        session: {
          pageData: {
            serviceDirector: {},
          },
        },
        body: {
          addressLine1: '29 Acacia Road',
          addressCity: 'London',
          addressPostcode: 'W1 2AB',
        },
      })

      await call('post')
    })
    it('should redirect to service director check your answers page', () => {
      sinon.assert.calledOnceWithExactly(
        res.redirect,
        formatServiceAndAccountPathsFor(
          paths.simplifiedAccount.settings.adyenDetails.serviceDirector.checkYourAnswers,
          SERVICE_EXTERNAL_ID,
          SERVICE_TYPE,
          GATEWAY_ACCOUNT.getSwitchingCredential().externalId
        )
      )
    })
  })
})
