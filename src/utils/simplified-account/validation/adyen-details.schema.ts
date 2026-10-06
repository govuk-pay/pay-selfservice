import { body } from 'express-validator'

const adyenDetailsSchema = {
  acceptTerms: {
    validate: body('acceptTerms')
      .notEmpty()
      .withMessage('Select the checkbox to confirm that you have the legal authority to accept these terms'),
  },
  selectTakingPaymentsFor: {
    validate: body('takingPaymentsFor').notEmpty().withMessage('You must make a selection'),
  },
}

export { adyenDetailsSchema }
