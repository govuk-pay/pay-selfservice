import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import { GatewayAccountFixture } from '@test/fixtures/gateway-account/gateway-account.fixture'
import { PaymentProvider } from '@models/constants/payment-provider'
import { UserFixture } from '@test/fixtures/user/user.fixture'
import { ServiceFixture } from '@test/fixtures/service/service.fixture'
import sinon from 'sinon'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { utils } from '@govuk-pay/pay-js-commons'

const { countries } = utils
const SERVICE_EXTERNAL_ID = 'service123abc'
const SERVICE_TYPE = 'live'
const serviceFixture = new ServiceFixture({
  externalId: SERVICE_EXTERNAL_ID,
})
const GATEWAY_ACCOUNT = GatewayAccountFixture.forSwitchingPsp(PaymentProvider.STRIPE, PaymentProvider.ADYEN, [], [], {
  type: 'live',
}).toGatewayAccount()
const TEMPLATE_PATH = 'simplified-account/settings/adyen-details/organisation-details'
const mockResponse = sinon.stub()

const { res, call, nextRequest } = new ControllerTestBuilder(
  '@controllers/simplified-account/settings/adyen-details/organisation-details/organisation-details.controller'
)
  .withServiceExternalId(SERVICE_EXTERNAL_ID)
  .withAccount(GATEWAY_ACCOUNT)
  .withUser(UserFixture.asServiceAdmin([serviceFixture]).toUser())
  .withStubs({
    '@utils/response': { response: mockResponse },
  })
  .build()

describe('Controller: settings/adyen-details/organisation-details/organisation-details', () => {
  describe('get', () => {
    describe('with no session data', () => {
      beforeEach(async () => {
        nextRequest({ session: {} })
        await call('get')
      })

      it('should call the response function with the template path', () => {
        mockResponse.should.have.been.calledOnce
        mockResponse.should.have.been.calledWith(sinon.match.any, sinon.match.any, TEMPLATE_PATH)
      })

      it('should call the response method with blank organisation details, hasCompanyRegistrationNumber, countries and backLink', () => {
        mockResponse.should.have.been.calledOnce
        const context = mockResponse.firstCall.lastArg as {
          organisationDetails: object
          hasCompanyRegistrationNumber: string
          countries: unknown[]
          backLink: string
        }
        sinon.assert.match(context, {
          organisationDetails: {
            organisationName: '',
            addressLine1: '',
            addressLine2: '',
            addressCity: '',
            addressPostcode: '',
            addressCountry: 'GB',
          },
          hasCompanyRegistrationNumber: '',
          countries: countries.govukFrontendFormatted('GB'),
          backLink: formatServiceAndAccountPathsFor(
            paths.simplifiedAccount.settings.switchPsp.switchToAdyen.index,
            SERVICE_EXTERNAL_ID,
            SERVICE_TYPE
          ),
        })
      })
    })

    describe('with existing session data', () => {
      beforeEach(async () => {
        nextRequest({
          session: {
            pageData: {
              organisationDetails: {
                organisationName: 'Test Organisation',
                addressLine1: '1 Test Street',
                addressCity: 'swansea',
                addressPostcode: 'T3 5TT',
                addressCountry: 'GB',
                hasCompanyRegistrationNumber: 'true',
              },
            },
          },
        })
        await call('get')
      })

      it('should call the response method with the session values', () => {
        const context = mockResponse.firstCall.lastArg as {
          organisationDetails: { organisationName: string }
          hasCompanyRegistrationNumber: string
        }
        sinon.assert.match(context.organisationDetails, {
          organisationName: 'Test Organisation',
          addressLine1: '1 Test Street',
          addressCity: 'swansea',
          addressPostcode: 'T3 5TT',
          addressCountry: 'GB',
        })
        sinon.assert.match(context.hasCompanyRegistrationNumber, 'true')
      })
    })
  })

  describe('post', () => {
    const VALID_BODY = {
      organisationName: 'Test Organisation',
      addressLine1: '1 Test Street',
      addressLine2: '',
      addressCity: 'swansea',
      addressPostcode: 'T3 5TT',
      addressCountry: 'GB',
      email: 'test@example.com',
      hasCompanyRegistrationNumber: 'true',
    }

    describe('with a valid body', () => {
      it('should redirect to the company registration number page', async () => {
        nextRequest({ body: VALID_BODY, session: {} })
        await call('post')
        sinon.assert.calledOnceWithExactly(
          res.redirect,
          formatServiceAndAccountPathsFor(
            paths.simplifiedAccount.settings.adyenDetails.organisationDetails.companyRegistration,
            SERVICE_EXTERNAL_ID,
            SERVICE_TYPE,
            GATEWAY_ACCOUNT.getSwitchingCredential().externalId
          )
        )
      })

      it('should redirect to the VAT registration number page when there is no company registration number', async () => {
        nextRequest({ body: { ...VALID_BODY, hasCompanyRegistrationNumber: 'false' }, session: {} })
        await call('post')
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

      it('should not render the page with errors', async () => {
        nextRequest({ body: VALID_BODY, session: {} })
        await call('post')
        mockResponse.should.not.have.been.called
      })
    })

    describe('with an empty body', () => {
      beforeEach(async () => {
        nextRequest({ body: {}, session: {} })
        await call('post')
      })

      it('should not redirect', () => {
        sinon.assert.notCalled(res.redirect)
      })

      it('should render the template with an error for every required field', () => {
        mockResponse.should.have.been.calledOnce
        mockResponse.should.have.been.calledWith(sinon.match.any, sinon.match.any, TEMPLATE_PATH)
        const context = mockResponse.firstCall.lastArg as {
          errors: { summary: { text: string; href: string }[]; formErrors: Record<string, string> }
        }
        sinon.assert.match(context.errors.formErrors, {
          organisationName: 'Enter an organisation name',
          addressLine1: 'Enter address line 1',
          addressCity: 'Enter a town or city',
          addressCountry: 'Select a country',
          addressPostcode: 'Enter a postcode',
          email: 'Enter an email address',
          hasCompanyRegistrationNumber: 'Select yes if your organisation has a company registration number',
        })
        sinon.assert.match(context.errors.summary, [
          { text: 'Enter an organisation name', href: '#organisation-name' },
          { text: 'Enter address line 1', href: '#address-line1' },
          { text: 'Enter a town or city', href: '#address-city' },
          { text: 'Select a country', href: '#address-country' },
          { text: 'Enter a postcode', href: '#address-postcode' },
          { text: 'Enter an email address', href: '#email' },
          {
            text: 'Select yes if your organisation has a company registration number',
            href: '#has-company-registration-number',
          },
        ])
      })
    })

    describe('with an invalid field', () => {
      beforeEach(async () => {
        nextRequest({
          body: { ...VALID_BODY, email: 'not-an-email', hasCompanyRegistrationNumber: 'false' },
          session: {},
        })
        await call('post')
      })

      it('should render the template with the submitted values, error and backLink', () => {
        mockResponse.should.have.been.calledOnce
        const context = mockResponse.firstCall.lastArg as {
          errors: { formErrors: Record<string, string> }
          organisationDetails: object
          hasCompanyRegistrationNumber: string
          countries: unknown[]
          backLink: string
        }
        sinon.assert.match(context, {
          errors: { formErrors: { email: "Enter an email address in the correct format" } },
          organisationDetails: {
            organisationName: 'Test Organisation',
            addressLine1: '1 Test Street',
            addressLine2: '',
            addressCity: 'swansea',
            addressPostcode: 'T3 5TT',
            addressCountry: 'GB',
            email: 'not-an-email',
          },
          hasCompanyRegistrationNumber: 'false',
          countries: countries.govukFrontendFormatted('GB'),
          backLink: formatServiceAndAccountPathsFor(
            paths.simplifiedAccount.settings.switchPsp.switchToAdyen.index,
            SERVICE_EXTERNAL_ID,
            SERVICE_TYPE
          ),
        })
        sinon.assert.notCalled(res.redirect)
      })
    })
  })
})
