import {
  adyenServiceDirectorAddressSchema,
  ADYEN_SERVICE_DIRECTOR_ADDRESS_VALIDATIONS,
} from './adyen-service-director-address.schema'
import { validationResult } from 'express-validator'
import { expect } from 'chai'

describe('adyenServiceDirectorAddressSchema', () => {
  describe('ADYEN_SERVICE_DIRECTOR_ADDRESS_VALIDATIONS', () => {
    it('should pass validation when all fields are valid', async () => {
      const req = {
        body: {
          addressLine1: '1 Test Street',
          addressLine2: 'Flat 2',
          addressCity: 'Swansea',
          addressPostcode: 'T3 5TT',
        },
      }

      await Promise.all(ADYEN_SERVICE_DIRECTOR_ADDRESS_VALIDATIONS.map((validation) => validation.run(req)))
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.true
    })

    it('should fail validation for every required field when the body is empty', async () => {
      const req = { body: {} }

      await Promise.all(ADYEN_SERVICE_DIRECTOR_ADDRESS_VALIDATIONS.map((validation) => validation.run(req)))
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array().map((error) => (error.type === 'field' ? error.path : undefined))).to.have.members([
        'addressLine1',
        'addressCity',
        'addressPostcode',
      ])
    })
  })

  describe('addressLine1', () => {
    it('should fail validation when addressLine1 is empty', async () => {
      const req = { body: { addressLine1: '  ' } }

      await adyenServiceDirectorAddressSchema.line1.validate.run(req)
      const errors = validationResult(req)

      expect(errors.array()).to.deep.include({
        type: 'field',
        value: '',
        msg: 'Enter address line 1',
        path: 'addressLine1',
        location: 'body',
      })
    })

    it('should fail validation when addressLine1 is too long', async () => {
      const addressLine1 = 'a'.repeat(256)
      const req = { body: { addressLine1 } }

      await adyenServiceDirectorAddressSchema.line1.validate.run(req)
      const errors = validationResult(req)

      expect(errors.array()).to.deep.include({
        type: 'field',
        value: addressLine1,
        msg: 'Address line 1 must be 255 characters or fewer',
        path: 'addressLine1',
        location: 'body',
      })
    })
  })

  describe('addressLine2', () => {
    it('should pass validation when addressLine2 is empty', async () => {
      const req = { body: { addressLine2: '' } }

      await adyenServiceDirectorAddressSchema.line2.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.true
    })

    it('should fail validation when addressLine2 is too long', async () => {
      const addressLine2 = 'a'.repeat(256)
      const req = { body: { addressLine2 } }

      await adyenServiceDirectorAddressSchema.line2.validate.run(req)
      const errors = validationResult(req)

      expect(errors.array()).to.deep.include({
        type: 'field',
        value: addressLine2,
        msg: 'Address line 2 must be 255 characters or fewer',
        path: 'addressLine2',
        location: 'body',
      })
    })
  })

  describe('addressCity', () => {
    it('should fail validation when addressCity is empty', async () => {
      const req = { body: { addressCity: '' } }

      await adyenServiceDirectorAddressSchema.city.validate.run(req)
      const errors = validationResult(req)

      expect(errors.array()).to.deep.include({
        type: 'field',
        value: '',
        msg: 'Enter a town or city',
        path: 'addressCity',
        location: 'body',
      })
    })
  })

  describe('addressPostcode', () => {
    const validPostcodes = ['T3 5TT', 'T35TT', 't3 5tt']
    validPostcodes.forEach((addressPostcode) => {
      it(`should pass validation when addressPostcode is: ${addressPostcode}`, async () => {
        const req = { body: { addressPostcode } }

        await adyenServiceDirectorAddressSchema.postcode.validate.run(req)
        const errors = validationResult(req)

        expect(errors.isEmpty()).to.be.true
      })
    })

    it('should fail validation when addressPostcode is empty', async () => {
      const req = { body: { addressPostcode: '' } }

      await adyenServiceDirectorAddressSchema.postcode.validate.run(req)
      const errors = validationResult(req)

      expect(errors.array()).to.deep.include({
        type: 'field',
        value: '',
        msg: 'Enter a postcode',
        path: 'addressPostcode',
        location: 'body',
      })
    })

    it('should fail validation when addressPostcode is not a real postcode', async () => {
      const req = { body: { addressPostcode: 'invalid-postcode' } }

      await adyenServiceDirectorAddressSchema.postcode.validate.run(req)
      const errors = validationResult(req)

      expect(errors.array()).to.deep.include({
        type: 'field',
        value: 'INVALID-POSTCODE',
        msg: 'Enter a real postcode',
        path: 'addressPostcode',
        location: 'body',
      })
    })
  })
})
