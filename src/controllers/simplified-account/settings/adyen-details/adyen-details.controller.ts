import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { response } from '@utils/response'
import { getOrganisationDetailsSummary } from '@services/adyen-details.service'
import { ServiceRequestParams } from '@utils/types/express/ServiceRequest'
import { PaymentProvider } from '@models/constants/payment-provider'

interface Params extends ServiceRequestParams {
  credentialExternalId: string
}

async function get(req: ServiceRequest<never, Params>, res: ServiceResponse) {
  const credential = req.account.gatewayAccountCredentials.find(
    (credential) => credential.externalId === req.params.credentialExternalId
  )
  if (!credential) {
    throw new Error(`No credential found for ID ${req.params.credentialExternalId}`)
  }
  if (credential.paymentProvider !== PaymentProvider.ADYEN) {
    throw new Error(`No credential found for ID ${req.params.credentialExternalId}`)
  }
  if (!credential?.credentials.legalEntityId) {
    throw new Error('Account not fully configured')
  }
  const organisationDetailsSummary = await getOrganisationDetailsSummary(credential?.credentials.legalEntityId)

  return response(req, res, 'simplified-account/settings/adyen-details/adyen-details', {
    organisationDetailsSummary,
    messages: res.locals.flash?.messages ?? [],
  })
}

export { get }
