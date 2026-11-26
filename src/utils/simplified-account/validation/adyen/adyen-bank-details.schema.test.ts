import { adyenBankDetailsSchema, ADYEN_BANK_DETAILS_VALIDATIONS } from './adyen-bank-details.schema'
import { validationResult } from 'express-validator'
import { expect } from 'chai'

describe('adyenBankDetailsSchema', () => {
  describe('ADYEN_BANK_DETAILS_VALIDATIONS', () => {
    it('should pass validation when all fields are valid', async () => {
      const req = { body: { sortCode: '309430', accountNumber: '00733445' } }

      await Promise.all(ADYEN_BANK_DETAILS_VALIDATIONS.map((validation) => validation.run(req)))
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.true
    })

    it('should fail validation for every field when the body is empty', async () => {
      const req = { body: {} }

      await Promise.all(ADYEN_BANK_DETAILS_VALIDATIONS.map((validation) => validation.run(req)))
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array().map((error) => (error.type === 'field' ? error.path : undefined))).to.have.members([
        'sortCode',
        'accountNumber',
      ])
    })
  })

  describe('sortCode', () => {
    it('should pass validation when sortCode is 6 digits', async () => {
      const req = { body: { sortCode: '309430' } }

      await adyenBankDetailsSchema.sortCode.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.true
    })

    const separatedSortCodes = ['30-94-30', '30 94 30', ' 309430 ']
    separatedSortCodes.forEach((sortCode) => {
      it(`should pass validation and remove separators when sortCode is: '${sortCode}'`, async () => {
        const req = { body: { sortCode } }

        await adyenBankDetailsSchema.sortCode.validate.run(req)
        const errors = validationResult(req)

        expect(errors.isEmpty()).to.be.true
        expect(req.body.sortCode).to.equal('309430')
      })
    })

    it('should fail validation when sortCode is empty', async () => {
      const req = { body: { sortCode: '' } }

      await adyenBankDetailsSchema.sortCode.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()).to.deep.include({
        type: 'field',
        value: '',
        msg: 'Enter a sort code',
        path: 'sortCode',
        location: 'body',
      })
    })

    it('should fail validation when sortCode contains letters', async () => {
      const req = { body: { sortCode: '30943A' } }

      await adyenBankDetailsSchema.sortCode.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()).to.deep.include({
        type: 'field',
        value: '30943A',
        msg: 'Enter a valid sort code',
        path: 'sortCode',
        location: 'body',
      })
    })

    it('should fail validation when sortCode is not 6 digits', async () => {
      const req = { body: { sortCode: '30943' } }

      await adyenBankDetailsSchema.sortCode.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()).to.deep.include({
        type: 'field',
        value: '30943',
        msg: 'Sort code must be 6 digits long',
        path: 'sortCode',
        location: 'body',
      })
    })
  })

  describe('accountNumber', () => {
    it('should pass validation when accountNumber is 8 digits', async () => {
      const req = { body: { accountNumber: '00733445' } }

      await adyenBankDetailsSchema.accountNumber.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.true
      expect(req.body.accountNumber).to.equal('00733445')
    })

    it('should fail validation when accountNumber is empty', async () => {
      const req = { body: { accountNumber: '' } }

      await adyenBankDetailsSchema.accountNumber.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()).to.deep.include({
        type: 'field',
        value: '',
        msg: 'Enter an account number',
        path: 'accountNumber',
        location: 'body',
      })
    })

    it('should fail validation when accountNumber contains letters', async () => {
      const req = { body: { accountNumber: '0073344A' } }

      await adyenBankDetailsSchema.accountNumber.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()).to.deep.include({
        type: 'field',
        value: '0073344A',
        msg: 'Enter a valid account number like 12345678',
        path: 'accountNumber',
        location: 'body',
      })
    })

    it('should fail validation when accountNumber is fewer than 6 digits', async () => {
      const req = { body: { accountNumber: '12345' } }

      await adyenBankDetailsSchema.accountNumber.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()).to.deep.include({
        type: 'field',
        value: '12345',
        msg: 'Account number must be between 6 and 8 digits long',
        path: 'accountNumber',
        location: 'body',
      })
    })

    it('should fail validation when accountNumber is more than 8 digits', async () => {
      const req = { body: { accountNumber: '123456789' } }

      await adyenBankDetailsSchema.accountNumber.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()).to.deep.include({
        type: 'field',
        value: '123456789',
        msg: 'Account number must be between 6 and 8 digits long',
        path: 'accountNumber',
        location: 'body',
      })
    })
  })
})
