import { body, ValidationChain } from 'express-validator'
import { invalidTelephoneNumber } from '@utils/telephone-number-utils'

const adyenResponsiblePersonContactDetailsSchema = {
  telephoneNumber: {
    validate: body('telephoneNumber')
      .trim()
      .notEmpty()
      .withMessage('Enter a telephone number')
      .bail()
      .custom((telephoneNumber: string) => !invalidTelephoneNumber(telephoneNumber))
      .withMessage('Enter a telephone number, like 01632 960 001, 07700 900 982 or +44 0808 157 0192'),
  },
  email: {
    validate: body('email')
      .trim()
      .notEmpty()
      .withMessage('Enter a work email address')
      .bail()
      .isEmail()
      .withMessage('Enter a real email address'),
  },
}

const ADYEN_RESPONSIBLE_PERSON_CONTACT_DETAILS_VALIDATIONS: ValidationChain[] = [
  adyenResponsiblePersonContactDetailsSchema.telephoneNumber.validate,
  adyenResponsiblePersonContactDetailsSchema.email.validate,
]

export { adyenResponsiblePersonContactDetailsSchema, ADYEN_RESPONSIBLE_PERSON_CONTACT_DETAILS_VALIDATIONS }
