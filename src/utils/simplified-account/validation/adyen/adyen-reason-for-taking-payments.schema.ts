import { GOVERNMENT_ACTIVITY_OPTIONS } from '@controllers/simplified-account/settings/adyen-details/organisation-details/constants'
import { body } from 'express-validator'

const adyenReasonForTakingPaymentsSchema = {
  selectGovernmentActivity: {
    validate: body('governmentActivity')
      .isIn(Object.keys(GOVERNMENT_ACTIVITY_OPTIONS))
      .withMessage('You must make a selection'),
  },
}

const ADYEN_REASON_FOR_TAKING_PAYMENTS_VALIDATIONS = [
  adyenReasonForTakingPaymentsSchema.selectGovernmentActivity.validate,
]

export { adyenReasonForTakingPaymentsSchema, ADYEN_REASON_FOR_TAKING_PAYMENTS_VALIDATIONS }
