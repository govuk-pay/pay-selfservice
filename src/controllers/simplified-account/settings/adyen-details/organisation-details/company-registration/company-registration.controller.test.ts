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
import { expect } from 'chai'

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
const CREDENTIAL_ID = GATEWAY_ACCOUNT.getSwitchingCredential().externalId

const mockResponse = sinon.stub()

const submitOrganisationDetails = sinon.stub().resolves()

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
    './utils': { submitOrganisationDetails },
  })
  .build()

const VALID_SESSION: Partial<OrganisationDetailsSession> = {
  organisationName: 'Test Organisation',
  addressLine1: '1 Test Street',
  addressLine2: '',
  addressCity: 'swansea',
  addressPostcode: 'T3 5TT',
  addressCountry: 'GB',
  telephoneNumber: '0161677677',
  website: 'www.bbc.co.uk',
  email: 'test@example.com',
  governmentActivity: 'general-local',
  registeredForVat: 'true',
  vatRegistrationNumber: 'GB123456789',
  hasCompanyRegistrationNumber: 'true',
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
            CREDENTIAL_ID
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
    describe('when a valid company registration number is provided', () => {
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

      it('should submit organisation details and redirect to the task list page', async () => {
        await call('post')

        sinon.assert.calledOnceWithExactly(
          submitOrganisationDetails,
          serviceFixture.toService(),
          GATEWAY_ACCOUNT,
          USER.externalId,
          UPDATED_SESSION,
          CREDENTIAL_ID
        )
        sinon.assert.calledOnceWithExactly(
          res.redirect,
          formatServiceAndAccountPathsFor(
            paths.simplifiedAccount.settings.switchPsp.switchToAdyen.index,
            SERVICE_EXTERNAL_ID,
            SERVICE_TYPE,
            CREDENTIAL_ID
          )
        )
      })
    })
    describe('with an empty company registration number', () => {
      let thisCall: Awaited<ReturnType<typeof call>>
      beforeEach(async () => {
        nextRequest({
          body: { companyRegistrationNumber: '' },
          session: { otherSessionData: 'keep', pageData: { organisationDetails: VALID_SESSION } },
        })
        thisCall = await call('post')
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
            paths.simplifiedAccount.settings.adyenDetails.organisationDetails.hasCompanyRegistration,
            SERVICE_EXTERNAL_ID,
            SERVICE_TYPE,
            GATEWAY_ACCOUNT.getSwitchingCredential().externalId
          ),
        })
      })
      it('should not call submitOrganisationDetails', () => {
        sinon.assert.notCalled(submitOrganisationDetails)
      })
      it('should not clear the session organisation details', () => {
        expect(thisCall.req.session).to.deep.include({ pageData: { organisationDetails: VALID_SESSION } })
      })
    })

    describe('with a company registration number that is not 8 characters', () => {
      let thisCall: Awaited<ReturnType<typeof call>>
      beforeEach(async () => {
        nextRequest({
          body: { companyRegistrationNumber: '12345' },
          session: { otherSessionData: 'keep', pageData: { organisationDetails: VALID_SESSION } },
        })
        thisCall = await call('post')
      })

      it('should not redirect', () => {
        sinon.assert.notCalled(res.redirect)
      })

      it('should show the error, backlink and the submitted value', () => {
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
          backLink: formatServiceAndAccountPathsFor(
            paths.simplifiedAccount.settings.adyenDetails.organisationDetails.hasCompanyRegistration,
            SERVICE_EXTERNAL_ID,
            SERVICE_TYPE,
            CREDENTIAL_ID
          ),
        })
      })
      it('should not call submitOrganisationDetails', () => {
        sinon.assert.notCalled(submitOrganisationDetails)
      })
      it('should not clear the session organisation details', () => {
        expect(thisCall.req.session).to.deep.include({ pageData: { organisationDetails: VALID_SESSION } })
      })
    })
  })
})
