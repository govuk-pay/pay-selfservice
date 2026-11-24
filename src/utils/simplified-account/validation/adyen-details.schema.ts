import { body } from 'express-validator'

const adyenDetailsSchema = {
  selectGovernmentActivity: {
    validate: body('governmentActivity').notEmpty().withMessage('You must make a selection'),
  },
}

export { adyenDetailsSchema }
