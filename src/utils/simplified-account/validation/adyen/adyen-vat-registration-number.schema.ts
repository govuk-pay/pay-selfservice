import { body, ValidationChain } from 'express-validator'

const adyenVatRegistrationNumberSchema = {
  vatRegistrationNumber: {
    validate: body('vatRegistrationNumber')
      .trim()
      .notEmpty()
      .withMessage('Enter a VAT number')
      .bail()
      .custom((value: string) => {
        if (!/^((GB)?((\d{9})|(\d{12})|((GD)([0-4])(\d{2}))|((HA)([5-9])(\d{2}))))$/.test(value)) {
          throw new Error('Enter a valid VAT registration number')
        }
        return true
      }),
  },
}

const ADYEN_VAT_REGISTRATION_NUMBER_VALIDATIONS: ValidationChain[] = [
  adyenVatRegistrationNumberSchema.vatRegistrationNumber.validate,
]

export { adyenVatRegistrationNumberSchema, ADYEN_VAT_REGISTRATION_NUMBER_VALIDATIONS }
