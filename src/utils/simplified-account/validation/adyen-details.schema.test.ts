import { adyenDetailsSchema } from './adyen-details.schema'
import { validationResult } from 'express-validator'
import { expect } from 'chai'

describe('adyenDetailsSchema', () => {
  describe('governmentActivity', () => {
    it('should pass validation when governmentActivity is provided', async () => {
      const req = { body: { governmentActivity: 'general-local' } }

      await adyenDetailsSchema.selectGovernmentActivity.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.true
    })

    it('should fail validation when governmentActivity is empty', async () => {
      const req = { body: { governmentActivity: '' } }

      await adyenDetailsSchema.selectGovernmentActivity.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()).to.deep.include({
        type: 'field',
        value: '',
        msg: 'You must make a selection',
        path: 'governmentActivity',
        location: 'body',
      })
    })
  })
})
