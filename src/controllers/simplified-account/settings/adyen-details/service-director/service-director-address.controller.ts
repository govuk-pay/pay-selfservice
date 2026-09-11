import type { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { response } from '@utils/response'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { FROM_REVIEW_QUERY_PARAM, ServiceDirectorSession } from './constants'

function get(req: ServiceRequest, res: ServiceResponse) {
  const { account } = req
  const switchingCredentialId = account.getSwitchingCredential().externalId
  const currentSession = ServiceDirectorSession.extract(req)

  if (currentSession.isEmpty()) {
    return res.redirect(
      formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.switchPsp.switchToAdyen.index,
        req.service.externalId,
        req.account.type
      )
    )
  }

  const address = {
    addressLine1: currentSession.addressLine1 ?? '',
    addressLine2: currentSession.addressLine2 ?? '',
    addressCity: currentSession.addressCity ?? '',
    addressPostcode: currentSession.addressPostcode ?? '',
  }

  const detailsLink = formatServiceAndAccountPathsFor(
    paths.simplifiedAccount.settings.adyenDetails.serviceDirector.details,
    req.service.externalId,
    req.account.type,
    switchingCredentialId
  )

  const reviewLink = formatServiceAndAccountPathsFor(
    paths.simplifiedAccount.settings.adyenDetails.serviceDirector.checkYourAnswers,
    req.service.externalId,
    req.account.type,
    switchingCredentialId
  )

  const backLink = req.query[FROM_REVIEW_QUERY_PARAM] === 'true' ? reviewLink : detailsLink

  return response(req, res, 'simplified-account/settings/adyen-details/service-director/address', {
    backLink,
    address,
  })
}

interface ServiceDirectorAddressBody {
  addressLine1: string
  addressLine2: string
  addressCity: string
  addressPostcode: string
}

function post(req: ServiceRequest<ServiceDirectorAddressBody>, res: ServiceResponse) {
  const { account } = req
  const switchingCredentialId = account.getSwitchingCredential().externalId
  const currentSession = ServiceDirectorSession.extract(req)

  ServiceDirectorSession.set(req, currentSession, {
    addressLine1: req.body.addressLine1,
    addressLine2: req.body.addressLine2,
    addressCity: req.body.addressCity,
    addressPostcode: req.body.addressPostcode,
  } as ServiceDirectorSession)

  return res.redirect(
    formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.adyenDetails.serviceDirector.checkYourAnswers,
      req.service.externalId,
      req.account.type,
      switchingCredentialId
    )
  )
}

export { get, post }
