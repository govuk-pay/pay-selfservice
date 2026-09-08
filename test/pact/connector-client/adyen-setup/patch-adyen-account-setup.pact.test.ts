// import { Pact, SpecificationVersion } from '@pact-foundation/pact'
// import path from 'path'
// import { V4MockServer } from '@pact-foundation/pact/src/v4/http/types'
// import ConnectorClient from '@services/clients/pay/ConnectorClient.class'
// import { RESTClientError } from '@govuk-pay/pay-js-commons/lib/utils/axios-base-client/errors'
// import { AdyenAccountSetupUpdateRequest } from '@models/gateway-account/AdyenAccountSetupUpdateRequest.class'
//
// const SERVICE_EXTERNAL_ID = 'valid-external-service-id'
// const ACCOUNT_TYPE = 'test'
// const CREDENTIAL_EXTERNAL_ID = 'valid-credential-external-id'
//
// describe('connector client - patch adyen account setup', () => {
//   const provider = new Pact({
//     consumer: 'selfservice',
//     provider: 'connector',
//     // @ts-expect-error this has never actually been a supported feature in Pact
//     // see https://github.com/pact-foundation/pact-js/issues/954
//     log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
//     dir: path.resolve(process.cwd(), 'pacts'),
//     spec: SpecificationVersion.SPECIFICATION_VERSION_V2,
//     pactfileWriteMode: 'merge',
//   })
//
//   it('should successfully update the adyen account setup', async () => {
//     const updateRequest = new AdyenAccountSetupUpdateRequest()
//       .replace()
//       .bankAccount('COMPLETED')
//       .replace()
//       .companyNumber('COMPLETED')
//       .replace()
//       .organisationDetails('COMPLETED')
//
//     await provider
//       .addInteraction()
//       .given('an adyen gateway account exists')
//       .uponReceiving('a valid adyen account setup update request')
//       .withRequest(
//         'PATCH',
//         `/v1/api/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/adyen-setup/${CREDENTIAL_EXTERNAL_ID}`,
//         (builder) => {
//           builder.jsonBody([
//             {
//               op: 'replace',
//               path: 'bank_account',
//               value: 'COMPLETED',
//             },
//             {
//               op: 'replace',
//               path: 'company_number',
//               value: 'COMPLETED',
//             },
//             {
//               op: 'replace',
//               path: 'organisation_details',
//               value: 'COMPLETED',
//             },
//           ])
//         }
//       )
//       .willRespondWith(200)
//       .executeTest<void>(async (mockServer: V4MockServer) => {
//         const connectorClient = new ConnectorClient(`http://127.0.0.1:${mockServer.port}`)
//
//         await connectorClient.gatewayAccounts.adyenSetup.patch(
//           SERVICE_EXTERNAL_ID,
//           ACCOUNT_TYPE,
//           CREDENTIAL_EXTERNAL_ID,
//           updateRequest
//         ).should.be.fulfilled
//       })
//   })
//
//   it('should return 404 if the gateway account is not found', async () => {
//     const updateRequest = new AdyenAccountSetupUpdateRequest().replace().bankAccount('COMPLETED')
//
//     await provider
//       .addInteraction()
//       .uponReceiving('an adyen account setup update request for a non-existent gateway account')
//       .withRequest(
//         'PATCH',
//         `/v1/api/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/adyen-setup/${CREDENTIAL_EXTERNAL_ID}`,
//         (builder) => {
//           builder.jsonBody([
//             {
//               op: 'replace',
//               path: 'bank_account',
//               value: 'COMPLETED',
//             },
//           ])
//         }
//       )
//       .willRespondWith(404)
//       .executeTest<void>(async (mockServer: V4MockServer) => {
//         const connectorClient = new ConnectorClient(`http://127.0.0.1:${mockServer.port}`)
//
//         return connectorClient.gatewayAccounts.adyenSetup
//           .patch(SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, CREDENTIAL_EXTERNAL_ID, updateRequest)
//           .should.be.rejectedWith(RESTClientError)
//           .then((error: RESTClientError) => {
//             error.errorCode.should.eq(404)
//           })
//       })
//   })
//
//   it('should return 404 if the gateway account credential is not found', async () => {
//     const updateRequest = new AdyenAccountSetupUpdateRequest().replace().bankAccount('COMPLETED')
//
//     await provider
//       .addInteraction()
//       .given('an adyen gateway account exists')
//       .uponReceiving('an adyen account setup update request for a non-existent credential')
//       .withRequest(
//         'PATCH',
//         `/v1/api/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/adyen-setup/this-credential-does-not-exist`,
//         (builder) => {
//           builder.jsonBody([
//             {
//               op: 'replace',
//               path: 'bank_account',
//               value: 'COMPLETED',
//             },
//           ])
//         }
//       )
//       .willRespondWith(404)
//       .executeTest<void>(async (mockServer: V4MockServer) => {
//         const connectorClient = new ConnectorClient(`http://127.0.0.1:${mockServer.port}`)
//
//         return connectorClient.gatewayAccounts.adyenSetup
//           .patch(SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, 'this-credential-does-not-exist', updateRequest)
//           .should.be.rejectedWith(RESTClientError)
//           .then((error: RESTClientError) => {
//             error.errorCode.should.eq(404)
//           })
//       })
//   })
//
//   it('should return 404 if the gateway account is not an Adyen account', async () => {
//     const updateRequest = new AdyenAccountSetupUpdateRequest().replace().bankAccount('COMPLETED')
//
//     await provider
//       .addInteraction()
//       .given('a stripe gateway account with external id 42 exists in the database')
//       .uponReceiving('an adyen account setup update request for the stripe gateway account')
//       .withRequest(
//         'PATCH',
//         `/v1/api/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/adyen-setup/${CREDENTIAL_EXTERNAL_ID}`,
//         (builder) => {
//           builder.jsonBody([
//             {
//               op: 'replace',
//               path: 'bank_account',
//               value: 'COMPLETED',
//             },
//           ])
//         }
//       )
//       .willRespondWith(404)
//       .executeTest<void>(async (mockServer: V4MockServer) => {
//         const connectorClient = new ConnectorClient(`http://127.0.0.1:${mockServer.port}`)
//
//         return connectorClient.gatewayAccounts.adyenSetup
//           .patch(SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, CREDENTIAL_EXTERNAL_ID, updateRequest)
//           .should.be.rejectedWith(RESTClientError)
//           .then((error: RESTClientError) => {
//             error.errorCode.should.eq(404)
//           })
//       })
//   })
// })
