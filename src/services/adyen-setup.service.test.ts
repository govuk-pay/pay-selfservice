import sinon from 'sinon'
import chaiAsPromised from 'chai-as-promised'
import proxyquire from 'proxyquire'
import chai from 'chai'
import { AdyenAccountSetupTaskName } from '@models/gateway-account/AdyenAccountSetup.class'
import { AdyenAccountSetupUpdateRequest } from '@models/gateway-account/AdyenAccountSetupUpdateRequest.class'
import * as AdyenSetupService from './adyen-setup.service'
chai.use(chaiAsPromised)
const expect = chai.expect

const SERVICE_EXTERNAL_ID = 'service123abc'
const ACCOUNT_TYPE = 'live'
const CREDENTIAL_EXTERNAL_ID = 'adyen-credential-123-abc'

describe('Adyen setup service', function () {
  describe('markTaskAsComplete', function () {
    it('should patch the given task to COMPLETED using the connector client', async function () {
      const patchStub = sinon.stub<[string, string, string, AdyenAccountSetupUpdateRequest]>().resolves()

      const ConnectorClientStub = function () {
        return {
          gatewayAccounts: {
            adyenSetup: {
              patch: patchStub,
            },
          },
        }
      }

      const adyenSetupService = proxyquire<typeof AdyenSetupService>('./adyen-setup.service', {
        '@services/clients/pay/ConnectorClient.class': ConnectorClientStub,
      })

      await adyenSetupService.markTaskAsComplete(
        SERVICE_EXTERNAL_ID,
        ACCOUNT_TYPE,
        CREDENTIAL_EXTERNAL_ID,
        'organisationDetails'
      )

      const [serviceExternalId, accountType, credentialExternalId, updateRequest] = patchStub.firstCall.args
      expect(serviceExternalId).to.equal(SERVICE_EXTERNAL_ID)
      expect(accountType).to.equal(ACCOUNT_TYPE)
      expect(credentialExternalId).to.equal(CREDENTIAL_EXTERNAL_ID)
      expect(updateRequest.toJson()).to.deep.equal([
        {
          op: 'replace',
          path: 'organisation_details',
          value: 'COMPLETED',
        },
      ])
    })

    it('should map each task name to its connector path', async function () {
      const cases: [AdyenAccountSetupTaskName, string][] = [
        ['organisationDetails', 'organisation_details'],
        ['legalTerms', 'legal_terms'],
        ['bankDetails', 'bank_details'],
        ['responsiblePerson', 'responsible_person'],
        ['director', 'director'],
        ['reasonForTakingPayments', 'reason_for_taking_payments'],
      ]

      for (const [taskName, expectedPath] of cases) {
        const patchStub = sinon.stub<[string, string, string, AdyenAccountSetupUpdateRequest]>().resolves()

        const ConnectorClientStub = function () {
          return {
            gatewayAccounts: {
              adyenSetup: {
                patch: patchStub,
              },
            },
          }
        }

        const adyenSetupService = proxyquire<typeof AdyenSetupService>('./adyen-setup.service', {
          '@services/clients/pay/ConnectorClient.class': ConnectorClientStub,
        })

        await adyenSetupService.markTaskAsComplete(SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, CREDENTIAL_EXTERNAL_ID, taskName)

        expect(patchStub.firstCall.args[3].toJson()).to.deep.equal([
          {
            op: 'replace',
            path: expectedPath,
            value: 'COMPLETED',
          },
        ])
      }
    })

    it('should propagate errors from the connector client', async function () {
      const error = new Error('Connector patch failed')
      const patchStub = sinon.stub<[string, string, string, AdyenAccountSetupUpdateRequest]>().rejects(error)

      const ConnectorClientStub = function () {
        return {
          gatewayAccounts: {
            adyenSetup: {
              patch: patchStub,
            },
          },
        }
      }

      const adyenSetupService = proxyquire<typeof AdyenSetupService>('./adyen-setup.service', {
        '@services/clients/pay/ConnectorClient.class': ConnectorClientStub,
      })

      await expect(
        adyenSetupService.markTaskAsComplete(
          SERVICE_EXTERNAL_ID,
          ACCOUNT_TYPE,
          CREDENTIAL_EXTERNAL_ID,
          'organisationDetails'
        )
      ).to.be.rejectedWith(error)
    })
  })
})
