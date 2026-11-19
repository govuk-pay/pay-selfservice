import { Types } from '@adyen/api-library'
import { ServiceRequest } from '@utils/types/express'
import lodash from 'lodash'

type VatAbsenceReasonEnum = Types.legalEntityManagement.Organization.VatAbsenceReasonEnum

const CREATE_SESSION_KEY = 'session.pageData.organisationDetails'

export interface CompanyRegistrationBody {
  companyRegistrationNumber: string
}

export interface HasCompanyRegistrationBody {
  hasCompanyRegistrationNumber: string
}

export interface VatRegistrationBody {
  vatRegistrationNumber: string
}

export interface RegisteredForVatBody {
  registeredForVat: string
}

export interface NotRegisteredForVatBody {
  notRegisteredForVat: VatAbsenceReason
}

export interface GovernmentActivityBody {
  governmentActivity: GovernmentActivity
}

export interface OrganisationDetailsBody {
  organisationName: string
  addressLine1: string
  addressLine2: string
  addressCity: string
  addressPostcode: string
  addressCountry: string
  email: string
}

export class OrganisationDetailsSession {
  organisationName?: string
  addressLine1?: string
  addressLine2?: string
  addressCity?: string
  addressPostcode?: string
  addressCountry?: string
  hasCompanyRegistrationNumber?: string
  companyRegistrationNumber?: string
  vatRegistrationNumber?: string
  email?: string
  governmentActivity?: GovernmentActivity
  registeredForVat?: string
  notRegisteredForVat?: VatAbsenceReason

  constructor(data: Partial<OrganisationDetailsSession>) {
    Object.assign(this, data)
  }

  static extract(req: ServiceRequest<unknown>) {
    return new OrganisationDetailsSession(lodash.get(req, CREATE_SESSION_KEY, {} as OrganisationDetailsSession))
  }

  static set(req: ServiceRequest<unknown>, ...sessionData: OrganisationDetailsSession[]) {
    lodash.set(req, CREATE_SESSION_KEY, Object.assign({}, ...sessionData))
  }

  static clear(req: ServiceRequest<unknown>) {
    return lodash.unset(req, CREATE_SESSION_KEY)
  }

  isEmpty() {
    return lodash.isEmpty(lodash.omitBy(this, (v) => lodash.isUndefined(v)))
  }
}

export type GovernmentActivity = 'general-local' | 'police-safety' | 'everything-else'

export type VatAbsenceReason = 'exempt' | 'below-vat-threshold'

export const VAT_ABSENCE_MAP: Record<VatAbsenceReason, VatAbsenceReasonEnum> = {
  'exempt': Types.legalEntityManagement.Organization.VatAbsenceReasonEnum.IndustryExemption,
  'below-vat-threshold': Types.legalEntityManagement.Organization.VatAbsenceReasonEnum.BelowTaxThreshold
}

export const INDUSTRY_CODE_MAP: Record<GovernmentActivity, string> = {
  'general-local': '921',
  'police-safety': '92219',
  'everything-else': '92B',
}
