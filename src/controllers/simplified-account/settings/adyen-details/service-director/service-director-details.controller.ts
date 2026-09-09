import type { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { response } from '@utils/response'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { FROM_REVIEW_QUERY_PARAM, ServiceDirectorSession } from './constants'

function get(req: ServiceRequest, res: ServiceResponse) {
  const currentSession = ServiceDirectorSession.extract(req)
  const { account } = req
  const switchingCredentialId = account.getSwitchingCredential().externalId

  const name = {
    firstName: currentSession.firstName ?? '',
    lastName: currentSession.lastName ?? '',
  }

  const dob = {
    dobDay: currentSession.dobDay ?? '',
    dobMonth: currentSession.dobMonth ?? '',
    dobYear: currentSession.dobYear ?? '',
  }

  const email = {
    email: currentSession.email ?? '',
  }

  const switchToAdyenLink = formatServiceAndAccountPathsFor(
    paths.simplifiedAccount.settings.switchPsp.switchToAdyen.index,
    req.service.externalId,
    req.account.type
  )

  const reviewLink = formatServiceAndAccountPathsFor(
    paths.simplifiedAccount.settings.adyenDetails.serviceDirector.checkYourAnswers,
    req.service.externalId,
    req.account.type,
    switchingCredentialId
  )

  const backLink = req.query[FROM_REVIEW_QUERY_PARAM] === 'true' ? reviewLink : switchToAdyenLink

  return response(req, res, 'simplified-account/settings/adyen-details/service-director/details', {
    backLink,
    name,
    dob,
    email,
  })
}

interface ServiceDirectorDetailsBody {
  firstName: string
  lastName: string
  dobDay: string
  dobMonth: string
  dobYear: string
  email: string
}

function post(req: ServiceRequest<ServiceDirectorDetailsBody>, res: ServiceResponse) {
  const { account } = req
  const switchingCredentialId = account.getSwitchingCredential().externalId
  const currentSession = ServiceDirectorSession.extract(req)

  ServiceDirectorSession.set(req, currentSession, {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    dobDay: req.body.dobDay,
    dobMonth: req.body.dobMonth,
    dobYear: req.body.dobYear,
    email: req.body.email,
  } as ServiceDirectorSession)

  return res.redirect(
    formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.adyenDetails.serviceDirector.address,
      req.service.externalId,
      req.account.type,
      switchingCredentialId
    )
  )
}

export { get, post }
