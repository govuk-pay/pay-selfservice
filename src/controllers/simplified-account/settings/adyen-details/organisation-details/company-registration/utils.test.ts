import { PaymentProvider } from '@models/constants/payment-provider'
import { GatewayAccountFixture } from '@test/fixtures/gateway-account/gateway-account.fixture'
import { ServiceFixture } from '@test/fixtures/service/service.fixture'
import { OrganisationDetailsSession } from '../constants'
import sinon from 'sinon'
import proxyquire from 'proxyquire'
import { MerchantDetailsFixture } from '@test/fixtures/service/merchant-details.fixture'

const TELEPHONE_NUMBER = '01234 567890'
const SERVICE = new ServiceFixture({
  externalId: 'service123abc',
  merchantDetails: new MerchantDetailsFixture({
    telephoneNumber: TELEPHONE_NUMBER,
  }),
}).toService()
const GATEWAY_ACCOUNT = GatewayAccountFixture.forSwitchingPsp(PaymentProvider.STRIPE, PaymentProvider.ADYEN, [], [], {
  type: 'live',
}).toGatewayAccount()
const CREDENTIAL_ID = GATEWAY_ACCOUNT.getSwitchingCredential().externalId
const USER_EXTERNAL_ID = 'user123abc'
const SESSION = new OrganisationDetailsSession({
  organisationName: 'Test Org',
  governmentActivity: 'general-local',
  companyRegistrationNumber: '01234567',
})

const createOrganisation = sinon.stub().resolves({
  legalEntity: { id: 'LE123' },
  businessLine: { id: 'BL123' },
  accountHolder: { id: 'AH123' },
  balanceAccount: { id: 'BA123' },
})
const createStore = sinon.stub().resolves({ id: 'ST123' })
const markTaskAsComplete = sinon.stub().resolves()
const setAdyenStoreId = sinon.stub().resolves()
const getStoreDetailsForStripeMigration = sinon
  .stub()
  .resolves({ telephoneNumber: TELEPHONE_NUMBER, statementDescriptor: 'TEST SERVICE' })

const { submitOrganisationDetails } = proxyquire('./utils', {
  '@services/adyen-details.service': { createOrganisation, createStore, setAdyenStoreId },
  '@services/stripe-details.service': { getStoreDetailsForStripeMigration },
  '@services/adyen-setup.service': { markTaskAsComplete },
}) as typeof import('./utils')

describe('submitOrganisationDetails', () => {
  beforeEach(() => {
    sinon.resetHistory()
  })
  it('should create Adyen legal entity and mark organisation details task as complete', async () => {
    await submitOrganisationDetails(SERVICE, GATEWAY_ACCOUNT, USER_EXTERNAL_ID, SESSION, CREDENTIAL_ID)

    sinon.assert.calledOnceWithExactly(
      createOrganisation,
      SESSION,
      SERVICE,
      GATEWAY_ACCOUNT.type,
      CREDENTIAL_ID,
      USER_EXTERNAL_ID
    )

    sinon.assert.calledOnceWithExactly(
      setAdyenStoreId,
      SERVICE.externalId,
      GATEWAY_ACCOUNT.type,
      CREDENTIAL_ID,
      USER_EXTERNAL_ID,
      'ST123'
    )

    sinon.assert.calledOnceWithExactly(
      markTaskAsComplete,
      SERVICE.externalId,
      GATEWAY_ACCOUNT.type,
      CREDENTIAL_ID,
      'organisationDetails'
    )

    sinon.assert.callOrder(
      getStoreDetailsForStripeMigration,
      createOrganisation,
      createStore,
      setAdyenStoreId,
      markTaskAsComplete
    )
  })

  it('should create a store for the business line using the Stripe statement descriptor', async () => {
    await submitOrganisationDetails(SERVICE, GATEWAY_ACCOUNT, USER_EXTERNAL_ID, SESSION, CREDENTIAL_ID)

    sinon.assert.calledOnceWithExactly(getStoreDetailsForStripeMigration, SERVICE, GATEWAY_ACCOUNT)
    sinon.assert.calledOnceWithExactly(createStore, {
      businessLineId: 'BL123',
      balanceAccountId: 'BA123',
      serviceName: SERVICE.name,
      statementDescriptor: 'TEST SERVICE',
      telephoneNumber: TELEPHONE_NUMBER,
      organisationDetails: SESSION,
    })
  })
})
