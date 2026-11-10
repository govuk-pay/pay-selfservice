import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import { GatewayAccountFixture } from '@test/fixtures/gateway-account/gateway-account.fixture'
import { PaymentProvider } from '@models/constants/payment-provider'
import { UserFixture } from '@test/fixtures/user/user.fixture'
import { ServiceFixture } from '@test/fixtures/service/service.fixture'
import sinon from 'sinon'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { lookup } from '@controllers/policy/supported-policy-documents'

const SERVICE_EXTERNAL_ID = 'service123abc'
const SERVICE_TYPE = 'live'
const serviceFixture = new ServiceFixture({
  externalId: SERVICE_EXTERNAL_ID,
})
const GATEWAY_ACCOUNT = GatewayAccountFixture.forSwitchingPsp(PaymentProvider.STRIPE, PaymentProvider.ADYEN, [], [], {
  type: 'live',
}).toGatewayAccount()

const TEMPLATE_PATH = 'simplified-account/settings/adyen-details/company-registration/organisation-registration-upload'

const mockResponse = sinon.stub()

const mockBucketGetLinkToPdf = sinon.spy(() => {
  return new Promise((resolve) => {
    resolve('html-url-link')
  })
})

const mockBucketService = {
  generatePrivateLink: mockBucketGetLinkToPdf,
}

const { res, call, nextRequest } = new ControllerTestBuilder(
  '@controllers/simplified-account/settings/adyen-details/organisation-details/company-registration/organisation-registration-upload.controller'
)
  .withServiceExternalId(SERVICE_EXTERNAL_ID)
  .withAccount(GATEWAY_ACCOUNT)
  .withUser(UserFixture.asServiceAdmin([serviceFixture]).toUser())
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@controllers/policy/aws-s3-policy-bucket': mockBucketService,
  })
  .build()

describe('Controller: settings/adyen-details/organisation-details/company-registration/organisation-registration-upload', () => {
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
      let documentConfig: unknown

      beforeEach(async () => {
        documentConfig = await lookup('public-sector-entity-confirmation')
        nextRequest({
          session: {
            pageData: {
              organisationDetails: {
                organisationName: 'Test Organisation',
                hasCompanyRegistrationNumber: 'false',
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

      it('should call s3 bucket to generate a private link to for the entity document', () => {
        mockBucketService.generatePrivateLink.should.have.been.calledWith(documentConfig)
      })

      it('should call the response method with hasCompanyRegistrationNumber, backLink and download link', () => {
        mockResponse.should.have.been.calledOnce
        const context = mockResponse.firstCall.lastArg as { hasCompanyRegistrationNumber: string; backLink: string }
        sinon.assert.match(context, {
          hasCompanyRegistrationNumber: 'false',
          backLink: formatServiceAndAccountPathsFor(
            paths.simplifiedAccount.settings.adyenDetails.organisationDetails.hasCompanyRegistration,
            SERVICE_EXTERNAL_ID,
            SERVICE_TYPE,
            GATEWAY_ACCOUNT.getSwitchingCredential().externalId
          ),
          downloadLink: 'html-url-link'
        })
      })
    })
  })

  describe('post', () => {
    beforeEach(() => {
      nextRequest({
        body: { companyRegistrationNumber: '01234567' },
        session: {
          pageData: {
            organisationDetails: {
              organisationName: 'Test Organisation',
            },
          },
        },
      })
    })

    it('should redirect to the VAT registration number page', async () => {
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
  })
})
