import { createLegalEntity } from '@services/clients/adyen/adyen-legal-entity-management.client'
import { OrganisationDetailsSession } from '@controllers/simplified-account/settings/adyen-details/organisation-details/constants'
import { LegalEntityInfoRequiredType } from '@adyen/api-library/lib/src/typings/legalEntityManagement/legalEntityInfoRequiredType'
import { Organization } from '@adyen/api-library/lib/src/typings/legalEntityManagement/organization'

export async function createOrganisation(session: OrganisationDetailsSession) {
  const organization: Organization = {
    legalName: session.organisationName ?? '',
    registeredAddress: {
      street: session.addressLine1,
      street2: session.addressLine2,
      city: session.addressCity,
      postalCode: session.addressPostcode,
      country: session.addressCountry ?? '',
    },
    registrationNumber: session.companyRegistrationNumber,
    vatNumber: session.vatRegistrationNumber,
  }

  const legalEntityInfo: LegalEntityInfoRequiredType = {
    type: LegalEntityInfoRequiredType.TypeEnum.Organization,
    organization,
  }

  return createLegalEntity(legalEntityInfo)
}
