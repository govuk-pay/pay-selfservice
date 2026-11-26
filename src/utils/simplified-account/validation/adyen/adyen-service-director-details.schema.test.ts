import { adyenServiceDirectorDetailsSchema } from './adyen-service-director-details.schema'
import { validationResult } from 'express-validator'
import { expect } from 'chai'

describe('adyenServiceDirectorDetailsSchema', () => {
  describe('email', () => {
    it('should pass validation when email is valid', async () => {
      const req = { body: { email: 'test@gov.uk' } }

      await adyenServiceDirectorDetailsSchema.email.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.true
    })

    it('should fail validation when email is empty', async () => {
      const req = { body: { email: '  ' } }

      await adyenServiceDirectorDetailsSchema.email.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()).to.deep.include({
        type: 'field',
        value: '',
        msg: 'Enter a work email address',
        path: 'email',
        location: 'body',
      })
    })

    it('should fail validation when email is not a real email address', async () => {
      const req = { body: { email: 'invalid-email' } }

      await adyenServiceDirectorDetailsSchema.email.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()).to.deep.include({
        type: 'field',
        value: 'invalid-email',
        msg: 'Enter a valid email address',
        path: 'email',
        location: 'body',
      })
    })
  })
})
