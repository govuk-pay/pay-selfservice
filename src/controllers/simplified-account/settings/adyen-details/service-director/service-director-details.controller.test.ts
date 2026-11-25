import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import { GatewayAccountFixture } from '@test/fixtures/gateway-account/gateway-account.fixture'
import { PaymentProvider } from '@models/constants/payment-provider'
import { UserFixture } from '@test/fixtures/user/user.fixture'
import { ServiceFixture } from '@test/fixtures/service/service.fixture'
import sinon from 'sinon'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { ServiceDirectorSession } from './constants'

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
  '@controllers/simplified-account/settings/adyen-details/service-director/service-director-details.controller'
)
  .withServiceExternalId(SERVICE_EXTERNAL_ID)
  .withAccount(GATEWAY_ACCOUNT)
  .withUser(UserFixture.asServiceAdmin([serviceFixture]).toUser())
  .withStubs({
    '@utils/response': { response: mockResponse },
  })
  .build()

describe('Controller: settings/adyen-details/service-director/service-director-details', () => {
  describe('get', () => {
    describe('with valid session data', () => {
      beforeEach(async () => {
        const currentSession: Partial<ServiceDirectorSession> = {
          firstName: 'Sam',
          lastName: 'Person',
          dobDay: '25',
          dobMonth: '12',
          dobYear: '1970',
          email: 'sam.person@gov.example.com',
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
          'simplified-account/settings/adyen-details/service-director/details'
        )
      })

      it('should call the response method with the backLink', () => {
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
      it('when called with valid data should redirect to the service director address', async () => {
        res.redirect.resetHistory()

        nextRequest({
          session: {
            pageData: {
              serviceDirector: {},
            },
          },
          body: {
            firstName: 'Sam',
            lastName: 'Person',
            dobDay: '25',
            dobMonth: '12',
            dobYear: '1970',
            email: 'sam.person@gov.example.com',
          },
        })

        await call('post')

        sinon.assert.calledOnceWithExactly(
          res.redirect,
          formatServiceAndAccountPathsFor(
            paths.simplifiedAccount.settings.adyenDetails.serviceDirector.address,
            SERVICE_EXTERNAL_ID,
            SERVICE_TYPE,
            GATEWAY_ACCOUNT.getSwitchingCredential().externalId
          )
        )
      })

      it('when called with invalid data should call the response function with the template path', async () => {
        res.redirect.resetHistory()

        nextRequest({
          session: {
            pageData: {
              serviceDirector: {},
            },
          },
          body: {
            firstName: '',
            lastName: '',
            dobDay: '31',
            dobMonth: '04',
            dobYear: '2002',
            email: 'invalid_email_address',
          },
        })

        await call('post')

        mockResponse.should.have.been.calledWith(
          sinon.match.any,
          sinon.match.any,
          'simplified-account/settings/adyen-details/service-director/details',
          sinon.match({
            errors: {
              summary: [
                { href: '#first-name', text: 'Enter the service director’s first name' },
                { href: '#last-name', text: 'Enter the service director’s last name' },
                { href: '#dob-day', text: 'Date of birth must be a real date' },
                { href: '#email', text: 'Enter a valid email address' },
              ],
              formErrors: {
                firstName: 'Enter the service director’s first name',
                lastName: 'Enter the service director’s last name',
                dob: 'Date of birth must be a real date',
                email: 'Enter a valid email address',
              },
            },
            backLink: '/service/service123abc/account/live/settings/switch-psp/switch-to-adyen',
            name: { firstName: '', lastName: '' },
            dob: { dobDay: '31', dobMonth: '04', dobYear: '2002' },
            email: 'invalid_email_address',
          })
        )
      })
    })
  })
})
