import { validationResult } from 'express-validator'
import { expect } from 'chai'
import { adyenLegalTermsSchema } from '@utils/simplified-account/validation/adyen/adyen-accept-legal-terms.schema'

describe('adyenLegalTermsSchema', () => {
  describe('acceptTerms', () => {
    it('should pass validation when acceptTerms is provided', async () => {
      const req = { body: { acceptTerms: 'true' } }

      await adyenLegalTermsSchema.acceptTerms.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.true
    })

    it('should fail validation when acceptTerms is empty', async () => {
      const req = { body: { acceptTerms: '' } }

      await adyenLegalTermsSchema.acceptTerms.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()).to.deep.include({
        type: 'field',
        value: '',
        msg: 'Select the checkbox to confirm that you have the legal authority to accept these terms',
        path: 'acceptTerms',
        location: 'body',
      })
    })
  })
})
