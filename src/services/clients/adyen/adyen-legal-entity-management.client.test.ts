import sinon from 'sinon'
import proxyquire from 'proxyquire'
import { expect } from 'chai'
import { Types } from '@adyen/api-library'

type LegalEntity = Types.legalEntityManagement.LegalEntity
type LegalEntityInfoRequiredType = Types.legalEntityManagement.LegalEntityInfoRequiredType

interface LegalEntityManagementClient {
  createLegalEntity: (legalEntityInfo: LegalEntityInfoRequiredType) => Promise<LegalEntity>
}

interface ClientConfig {
  apiKey: string
  environment: string
}

let createLegalEntityStub: sinon.SinonStub

describe('Adyen legal entity management client', () => {
  function loadModule(): LegalEntityManagementClient {
    createLegalEntityStub = sinon.stub()

    class MockAdyenClient {
      config: ClientConfig
      constructor(config: ClientConfig) {
        this.config = config
      }
    }

    class MockAdyenLegalEntityManagementAPI {
      client: MockAdyenClient
      LegalEntitiesApi: { createLegalEntity: sinon.SinonStub }
      constructor(client: MockAdyenClient) {
        this.client = client
        this.LegalEntitiesApi = { createLegalEntity: createLegalEntityStub }
      }
    }

    return proxyquire('./adyen-legal-entity-management.client', {
      '@adyen/api-library': {
        Client: MockAdyenClient,
        LegalEntityManagementAPI: MockAdyenLegalEntityManagementAPI,
        EnvironmentEnum: { TEST: 'TEST' },
      },
    }) as LegalEntityManagementClient
  }

  beforeEach(() => {
    process.env.ADYEN_LEGAL_ENTITY_MANAGEMENT_API_KEY = 'test-api-key'
  })

  afterEach(() => {
    delete process.env.ADYEN_LEGAL_ENTITY_MANAGEMENT_API_KEY
    createLegalEntityStub.resetHistory()
  })

  const legalEntityInfo: LegalEntityInfoRequiredType = {
    type: Types.legalEntityManagement.LegalEntityInfoRequiredType.TypeEnum.Individual,
    individual: {
      name: { firstName: 'John', lastName: 'Smith' },
      residentialAddress: {
        country: 'UK',
        city: 'London',
        postalCode: 'N11NN',
        street: '1 Test St',
      },
      birthData: { dateOfBirth: '1990-01-01' },
    },
  }

  it('calls the Adyen API to create a legal entity', async () => {
    const { createLegalEntity } = loadModule()
    const apiResponse = { id: 'LE123', type: 'organization' } as LegalEntity
    createLegalEntityStub.resolves(apiResponse)

    const result = await createLegalEntity(legalEntityInfo)

    sinon.assert.calledOnce(createLegalEntityStub)
    sinon.assert.calledWithExactly(createLegalEntityStub, legalEntityInfo)

    expect(result).to.equal(apiResponse)
  })
})
