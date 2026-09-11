import { ServiceRequest } from '@utils/types/express'
import lodash from 'lodash'

const CREATE_SESSION_KEY = 'session.pageData.serviceDirector'

export class ServiceDirectorSession {
  firstName?: string
  lastName?: string
  dobDay?: string
  dobMonth?: string
  dobYear?: string
  email?: string
  addressLine1?: string
  addressLine2?: string
  addressCity?: string
  addressPostcode?: string

  constructor(data: ServiceDirectorSession) {
    Object.assign(this, data)
  }

  static extract(req: ServiceRequest<unknown>) {
    return new ServiceDirectorSession(lodash.get(req, CREATE_SESSION_KEY, {} as ServiceDirectorSession))
  }

  static set(req: ServiceRequest<unknown>, ...sessionData: ServiceDirectorSession[]) {
    lodash.set(req, CREATE_SESSION_KEY, Object.assign({}, ...sessionData))
  }

  static clear(req: ServiceRequest<unknown>) {
    return lodash.unset(req, CREATE_SESSION_KEY)
  }

  isEmpty() {
    return lodash.isEmpty(lodash.omitBy(this, (v) => lodash.isUndefined(v)))
  }
}

export const FROM_REVIEW_QUERY_PARAM = 'fromReview'
