import { body, ValidationChain } from 'express-validator'
import { postcodeRegex } from '@utils/validation/postcode-validation'

const ADDRESS_FIELD_MAX_LENGTH = 255

const adyenResponsiblePersonAddressSchema = {
  line1: {
    validate: body('addressLine1')
      .trim()
      .notEmpty()
      .withMessage('Enter address line 1')
      .bail()
      .isLength({ max: ADDRESS_FIELD_MAX_LENGTH })
      .withMessage(`Address line 1 must be ${ADDRESS_FIELD_MAX_LENGTH} characters or fewer`)
      .bail(),
  },
  line2: {
    validate: body('addressLine2')
      .trim()
      .optional({ values: 'falsy' })
      .isLength({ max: ADDRESS_FIELD_MAX_LENGTH })
      .withMessage(`Address line 2 must be ${ADDRESS_FIELD_MAX_LENGTH} characters or fewer`)
      .bail(),
  },
  city: {
    validate: body('addressCity')
      .trim()
      .notEmpty()
      .withMessage('Enter a town or city')
      .bail()
      .isLength({ max: ADDRESS_FIELD_MAX_LENGTH })
      .withMessage(`Town or city must be ${ADDRESS_FIELD_MAX_LENGTH} characters or fewer`)
      .bail(),
  },
  postcode: {
    validate: body('addressPostcode')
      .trim()
      .customSanitizer((postcode: string) => postcode.toUpperCase())
      .notEmpty()
      .withMessage('Enter a postcode')
      .bail()
      .matches(postcodeRegex)
      .withMessage('Enter a real postcode'),
  },
}

const ADYEN_RESPONSIBLE_PERSON_ADDRESS_VALIDATIONS: ValidationChain[] = [
  adyenResponsiblePersonAddressSchema.line1.validate,
  adyenResponsiblePersonAddressSchema.line2.validate,
  adyenResponsiblePersonAddressSchema.city.validate,
  adyenResponsiblePersonAddressSchema.postcode.validate,
]

export { adyenResponsiblePersonAddressSchema, ADYEN_RESPONSIBLE_PERSON_ADDRESS_VALIDATIONS }
