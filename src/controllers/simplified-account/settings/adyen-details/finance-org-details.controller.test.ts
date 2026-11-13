import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import { GatewayAccountFixture } from '@test/fixtures/gateway-account/gateway-account.fixture'
import { PaymentProvider } from '@models/constants/payment-provider'
import { UserFixture } from '@test/fixtures/user/user.fixture'
import { ServiceFixture } from '@test/fixtures/service/service.fixture'
import sinon from 'sinon'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { CredentialFixture } from '@test/fixtures/gateway-account/credential.fixture'
import { expect } from 'chai'

const SERVICE_EXTERNAL_ID = 'service123abc'
const SERVICE_TYPE = 'live'
const serviceFixture = new ServiceFixture({
  externalId: SERVICE_EXTERNAL_ID,
})
const ORGANISATION_LEGAL_ENTITY_ID = 'LE_ORG_123'

const mockResponse = sinon.stub()
const createFinanceOrgDetails = sinon.stub().resolves()

describe('Controller: settings/adyen-details/finance-org-details', () => {
  const { req, res, call, nextRequest } = new ControllerTestBuilder(
    '@controllers/simplified-account/settings/adyen-details/finance-org-details.controller'
  )
    .withServiceExternalId(SERVICE_EXTERNAL_ID)
    .withAccount(
      GatewayAccountFixture.forSwitchingPsp(
        PaymentProvider.STRIPE,
        PaymentProvider.ADYEN,
        [],
        [{ credentials: CredentialFixture.forAdyen({ legalEntityId: ORGANISATION_LEGAL_ENTITY_ID }) }],
        {
          type: 'live',
        }
      ).toGatewayAccount()
    )
    .withUser(UserFixture.asServiceAdmin([serviceFixture]).toUser())
    .withStubs({
      '@utils/response': { response: mockResponse },
      '@services/adyen-details.service': { createFinanceOrgDetails },
    })
    .build()

  describe('get', () => {
    it('should call the response function with req, res, and the template path', async () => {
      await call('get')

      mockResponse.should.have.been.calledOnce
      mockResponse.should.have.been.calledWith(
        req,
        res,
        'simplified-account/settings/adyen-details/finance-org-details'
      )
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
    context('when a legalEntityId does not exisit', () => {
      beforeEach(() => {
        nextRequest({
          account: GatewayAccountFixture.forSwitchingPsp(
            PaymentProvider.STRIPE,
            PaymentProvider.ADYEN,
            [],
            [{ credentials: CredentialFixture.forAdyen({ legalEntityId: null }) }],
            {
              type: 'live',
            }
          ).toGatewayAccount(),
        })
      })

      it('should throw if legalEntityId is not available', async () => {
        await expect(call('post')).to.be.rejectedWith(
          'Cannot add finance org details: no Adyen legal entity ID on the switching credential'
        )
      })
    })

    context('when a legalEntityId does exisit', () => {
      beforeEach(() => {
        nextRequest({
          account: GatewayAccountFixture.forSwitchingPsp(
            PaymentProvider.STRIPE,
            PaymentProvider.ADYEN,
            [],
            [{ credentials: CredentialFixture.forAdyen({ legalEntityId: ORGANISATION_LEGAL_ENTITY_ID }) }],
            {
              type: 'live',
            }
          ).toGatewayAccount(),
          body: {
            annualTurnover: '500000',
            employeeCount: '125',
            financeDay: '12',
            financeMonth: '06',
            financeYear: '2012',
          },
        })
      })

      it('should call createFitnanceOrgDetails with correct values', async () => {
        await call('post')

        sinon.assert.calledOnceWithExactly(
          createFinanceOrgDetails,
          {
            annualTurnover: '500000',
            employeeCount: '125',
            financeDay: '12',
            financeMonth: '06',
            financeYear: '2012',
          },
          ORGANISATION_LEGAL_ENTITY_ID
        )
      })

      it('should redirect to the adyen index page', async () => {
        await call('post')

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
  })
})
