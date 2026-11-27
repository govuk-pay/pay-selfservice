import { validationResult } from 'express-validator'
import {
  adyenReasonForTakingPaymentsSchema,
  ADYEN_REASON_FOR_TAKING_PAYMENTS_VALIDATIONS,
} from './adyen-reason-for-taking-payments.schema'
import { expect } from 'chai'

describe('adyenReasonForTakingPaymentsSchema', () => {
  describe('ADYEN_REASON_FOR_TAKING_PAYMENTS_VALIDATIONS  ', () => {
    it('should pass validation when body is valid', async () => {
      const req = { body: { governmentActivity: 'general-local' } }

      for (const validation of ADYEN_REASON_FOR_TAKING_PAYMENTS_VALIDATIONS) {
        await validation.run(req)
      }

      const errors = validationResult(req)
      expect(errors.isEmpty()).to.be.true
    })
  })

  describe('adyenReasonForTakingPaymentsSchema', () => {
    it('should return error when governmentActivity is missing', async () => {
      const req = { body: {} }

      await adyenReasonForTakingPaymentsSchema.selectGovernmentActivity.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()).to.deep.equal([
        {
          type: 'field',
          value: undefined,
          msg: 'You must make a selection',
          path: 'governmentActivity',
          location: 'body',
        },
      ])
    })

    it('should return error when governmentActivity is blank', async () => {
      const req = { body: { governmentActivity: '' } }
      await adyenReasonForTakingPaymentsSchema.selectGovernmentActivity.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()).to.deep.equal([
        {
          type: 'field',
          value: '',
          msg: 'You must make a selection',
          path: 'governmentActivity',
          location: 'body',
        },
      ])
    })

    it('should return error when governmentActivity is wrong value', async () => {
      const req = { body: { governmentActivity: 'odd-value' } }
      await adyenReasonForTakingPaymentsSchema.selectGovernmentActivity.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()).to.deep.equal([
        {
          type: 'field',
          value: 'odd-value',
          msg: 'You must make a selection',
          path: 'governmentActivity',
          location: 'body',
        },
      ])
    })
  })
})
