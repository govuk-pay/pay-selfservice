import { body, ValidationChain } from 'express-validator'

const adyenLegalTermsSchema = {
  acceptTerms: {
    validate: body('acceptTerms')
      .notEmpty()
      .withMessage('Select the checkbox to confirm that you have the legal authority to accept these terms'),
  },
}

const ADYEN_LEGAL_TERMS_VALIDATIONS: ValidationChain[] = [
  adyenLegalTermsSchema.acceptTerms.validate,
]

export { adyenLegalTermsSchema, ADYEN_LEGAL_TERMS_VALIDATIONS }
