import { body, ValidationChain } from 'express-validator'
import { createSharedSchema } from './shared/adyen-shared.schema'

const sharedSchema = createSharedSchema('service director')

const adyenServiceDirectorDetailsSchema = {
  email: {
    validate: body('email')
      .trim()
      .notEmpty()
      .withMessage('Enter a work email address')
      .bail()
      .isEmail()
      .withMessage('Enter a valid email address'),
  },
}

const ADYEN_SERVICE_DIRECTOR_DETAILS_VALIDATIONS: ValidationChain[] = [
  sharedSchema.firstName.validate,
  sharedSchema.lastName.validate,
  sharedSchema.dob.dobDay.validate,
  sharedSchema.dob.dobMonth.validate,
  sharedSchema.dob.dobYear.validate,
  sharedSchema.dob.validate,
  adyenServiceDirectorDetailsSchema.email.validate,
]

export { adyenServiceDirectorDetailsSchema, ADYEN_SERVICE_DIRECTOR_DETAILS_VALIDATIONS }
