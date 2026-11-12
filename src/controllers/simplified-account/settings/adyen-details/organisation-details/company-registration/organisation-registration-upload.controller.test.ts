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

const TEMPLATE_PATH = 'simplified-account/settings/adyen-details/company-registration/organisation-registration-upload'

const mockResponse = sinon.stub()

const { req, res, call, nextRequest } = new ControllerTestBuilder(
  '@controllers/simplified-account/settings/adyen-details/organisation-details/company-registration/organisation-registration-upload.controller'
)
  .withServiceExternalId(SERVICE_EXTERNAL_ID)
  .withAccount(GATEWAY_ACCOUNT)
  .withUser(UserFixture.asServiceAdmin([serviceFixture]).toUser())
  .withStubs({
    '@utils/response': { response: mockResponse },
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
      beforeEach(async () => {
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

      it('should call the response method with hasCompanyRegistrationNumber and backLink', () => {
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
        })
      })
    })
  })

  describe('post', () => {
    describe('when uploading a valid file', () => {
      beforeEach(() => {
        nextRequest({
          file: {
            size: 10 * 1024 * 1024,
            mimetype: 'image/jpeg',
          },
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

      it('should redirect to the task index page', async () => {
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

    describe('when submitting invalid data', () => {
      describe('file is too large', () => {
        beforeEach(() => {
          nextRequest({
            file: {
              size: 11 * 1024 * 1024,
              mimetype: 'image/jpeg',
            },
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

        it('should not redirect', async () => {
          await call('post')
          sinon.assert.notCalled(res.redirect as sinon.SinonStub)
        })

        it('should re-render the upload page', async () => {
          await call('post')
          sinon.assert.calledOnce(mockResponse)
          sinon.assert.calledWithMatch(mockResponse, req, res, TEMPLATE_PATH)
        })

        it('should show the summary error', async () => {
          await call('post')
          const context = mockResponse.firstCall.lastArg as {
            errors: { summary: { text: string; href: string }[] }
          }
          sinon.assert.match(context.errors.summary, [
            {
              text: 'File size must be less than 10MB',
              href: '#government-entity-document',
            },
          ])
        })

        it('should show the inline error', async () => {
          await call('post')
          const context = mockResponse.firstCall.lastArg as {
            errors: { formErrors: Record<string, string> }
          }
          sinon.assert.match(context.errors.formErrors, {
            governmentEntityDocument: 'File size must be less than 10MB',
          })
        })
      })

      describe('mimetype is incorrect', () => {
        beforeEach(() => {
          nextRequest({
            file: {
              size: 10 * 1024 * 1024,
              mimetype: 'application/json',
            },
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

        it('should not redirect', async () => {
          await call('post')
          sinon.assert.notCalled(res.redirect as sinon.SinonStub)
        })

        it('should re-render the upload page', async () => {
          await call('post')
          sinon.assert.calledOnce(mockResponse)
          sinon.assert.calledWithMatch(mockResponse, req, res, TEMPLATE_PATH)
        })

        it('should show the summary error', async () => {
          await call('post')
          const context = mockResponse.firstCall.lastArg as {
            errors: { summary: { text: string; href: string }[] }
          }
          sinon.assert.match(context.errors.summary, [
            {
              text: 'File type must be PDF, JPG or PNG',
              href: '#government-entity-document',
            },
          ])
        })

        it('should show the inline error', async () => {
          await call('post')
          const context = mockResponse.firstCall.lastArg as {
            errors: { formErrors: Record<string, string> }
          }
          sinon.assert.match(context.errors.formErrors, {
            governmentEntityDocument: 'File type must be PDF, JPG or PNG',
          })
        })
      })

      describe('file is missing', () => {
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

        it('should not redirect', async () => {
          await call('post')
          sinon.assert.notCalled(res.redirect as sinon.SinonStub)
        })

        it('should re-render the upload page', async () => {
          await call('post')
          sinon.assert.calledOnce(mockResponse)
          sinon.assert.calledWithMatch(mockResponse, req, res, TEMPLATE_PATH)
        })

        it('should show the summary error', async () => {
          await call('post')
          const context = mockResponse.firstCall.lastArg as {
            errors: { summary: { text: string; href: string }[] }
          }
          sinon.assert.match(context.errors.summary, [
            {
              text: 'Select a file to upload',
              href: '#government-entity-document',
            },
          ])
        })

        it('should show the inline error', async () => {
          await call('post')
          const context = mockResponse.firstCall.lastArg as {
            errors: { formErrors: Record<string, string> }
          }
          sinon.assert.match(context.errors.formErrors, {
            governmentEntityDocument: 'Select a file to upload',
          })
        })
      })
    })
  })
})
