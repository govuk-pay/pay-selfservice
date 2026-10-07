import sinon from 'sinon'
import proxyquire from 'proxyquire'
import { expect } from 'chai'
import type { OrganisationDetailsSession } from '@controllers/simplified-account/settings/adyen-details/organisation-details/constants'
import { Types } from '@adyen/api-library'

type LegalEntity = Types.legalEntityManagement.LegalEntity
type CreateOrganisation = (session: OrganisationDetailsSession) => Promise<LegalEntity>

interface AdyenDetailsService {
  createOrganisation: CreateOrganisation
}

describe('Adyen details service', () => {
  let createLegalEntityStub: sinon.SinonStub
  let createOrganisation: CreateOrganisation

  const ORGANISATION_TYPE = 'organization'

  const fullSession = {
    organisationName: 'Test Org Ltd',
    addressLine1: '1 Test Street',
    addressLine2: 'Test Building',
    addressCity: 'London',
    addressPostcode: 'SW1A 1AA',
    addressCountry: 'GB',
    companyRegistrationNumber: '12345678',
    vatRegistrationNumber: 'GB123456789',
  } as OrganisationDetailsSession

  beforeEach(() => {
    createLegalEntityStub = sinon.stub()

    class ConnectorClientStub {
      gatewayAccounts = {
        patchCredentialsByServiceExternalIdAndAccountType: sinon.stub().resolves({}),
      }
    }

    const adyenDetailsService = proxyquire('./adyen-details.service', {
      '@models/gateway-account-credential/GatewayAccountCredentialUpdateRequest.class': {
        GatewayAccountCredentialUpdateRequest: class {},
      },
      '@services/clients/pay/ConnectorClient.class': ConnectorClientStub,
      '@services/clients/adyen/adyen-legal-entity-management.client': {
        createLegalEntity: createLegalEntityStub,
      },
    }) as AdyenDetailsService

    createOrganisation = adyenDetailsService.createOrganisation
  })

  afterEach(() => {
    createLegalEntityStub.resetHistory()
  })

  it('should create Adyen legal entity', async () => {
    const legalEntity = { id: 'LE123', type: ORGANISATION_TYPE }
    createLegalEntityStub.resolves(legalEntity)

    const result = await createOrganisation(fullSession)

    sinon.assert.calledOnce(createLegalEntityStub)

    expect(createLegalEntityStub.firstCall.args[0]).to.deep.equal({
      type: ORGANISATION_TYPE,
      organization: {
        legalName: 'Test Org Ltd',
        registeredAddress: {
          street: '1 Test Street',
          street2: 'Test Building',
          city: 'London',
          postalCode: 'SW1A 1AA',
          country: 'GB',
        },
        registrationNumber: '12345678',
        vatNumber: 'GB123456789',
      },
    })

    expect(result).to.equal(legalEntity)
  })
})
