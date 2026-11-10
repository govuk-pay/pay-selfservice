import { adyenDetailsSchema } from './adyen-details.schema'
import { validationResult } from 'express-validator'
import { expect } from 'chai'

describe('adyenDetailsSchema', () => {
  describe('acceptTerms', () => {
    it('should pass validation when acceptTerms is provided', async () => {
      const req = { body: { acceptTerms: 'true' } }

      await adyenDetailsSchema.acceptTerms.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.true
    })

    it('should fail validation when acceptTerms is empty', async () => {
      const req = { body: { acceptTerms: '' } }

      await adyenDetailsSchema.acceptTerms.validate.run(req)
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
  describe('registeredForVat', () => {
    it('should pass validation when registeredForVat is provided', async () => {
      const req = { body: { registeredForVat: 'true' } }

      await adyenDetailsSchema.registeredForVat.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.true
    })

    it('should fail validation when registeredForVat is empty', async () => {
      const req = { body: { registeredForVat: '' } }

      await adyenDetailsSchema.registeredForVat.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()).to.deep.include({
        type: 'field',
        value: '',
        msg: 'You must make a selection',
        path: 'registeredForVat',
        location: 'body',
      })
    })
  })
  describe('notRegisteredForVat', () => {
    it('should pass validation when notRegisteredForVat is provided', async () => {
      const req = { body: { notRegisteredForVat: 'exempt' } }

      await adyenDetailsSchema.notRegisteredForVat.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.true
    })

    it('should fail validation when notRegisteredForVat is empty', async () => {
      const req = { body: { notRegisteredForVat: '' } }

      await adyenDetailsSchema.notRegisteredForVat.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()).to.deep.include({
        type: 'field',
        value: '',
        msg: 'You must make a selection',
        path: 'notRegisteredForVat',
        location: 'body',
      })
    })
  })
})
