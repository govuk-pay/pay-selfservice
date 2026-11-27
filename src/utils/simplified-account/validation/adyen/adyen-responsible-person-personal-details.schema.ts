import { createSharedSchema } from './shared/adyen-shared.schema'

const sharedSchema = createSharedSchema('responsible person')

const ADYEN_RESPONSIBLE_PERSON_PERSONAL_DETAILS_VALIDATIONS = [
  sharedSchema.firstName.validate,
  sharedSchema.lastName.validate,
  sharedSchema.dob.validate,
  sharedSchema.dob.dobDay.validate,
  sharedSchema.dob.dobMonth.validate,
  sharedSchema.dob.dobYear.validate,
]

export { ADYEN_RESPONSIBLE_PERSON_PERSONAL_DETAILS_VALIDATIONS }
