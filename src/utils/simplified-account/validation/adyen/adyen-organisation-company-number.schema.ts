import { body, ValidationChain } from 'express-validator'

const adyenCompanyRegistrationNumberSchema = {
  companyRegistrationNumber: {
    validate: body('companyRegistrationNumber')
      .trim()
      .notEmpty()
      .withMessage('Enter a company registration number')
      .bail()
      .isLength({ min: 8, max: 8 })
      .withMessage('Company registration number must be 8 characters long')
      .bail()
  },
}

const ADYEN_COMPANY_REGISTRATION_NUMBER_VALIDATIONS: ValidationChain[] = [
  adyenCompanyRegistrationNumberSchema.companyRegistrationNumber.validate,
]

export { adyenCompanyRegistrationNumberSchema, ADYEN_COMPANY_REGISTRATION_NUMBER_VALIDATIONS }
