import {
  adyenOrganisationDetailsSchema,
  ADYEN_ORGANISATION_DETAILS_VALIDATIONS,
} from './adyen-organisation-details.schema'
import { validationResult } from 'express-validator'
import { expect } from 'chai'

describe('adyenOrganisationDetailsSchema', () => {
  describe('ADYEN_ORGANISATION_DETAILS_VALIDATIONS', () => {
    it('should pass validation when all fields are valid', async () => {
      const req = {
        body: {
          organisationName: 'test organisation',
          addressLine1: '5 Spring Terrace',
          addressLine2: 'Flat 1',
          addressCity: 'Swansea',
          addressCountry: 'GB',
          addressPostcode: 'W12AB',
          email: 'homer@test.com',
          hasCompanyRegistrationNumber: 'true',
        },
      }

      await Promise.all(ADYEN_ORGANISATION_DETAILS_VALIDATIONS.map((validation) => validation.run(req)))
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.true
    })
  })

  describe('organisationName', () => {
    it('should pass validation when organisationName is provided', async () => {
      const req = { body: { organisationName: 'test organisation' } }

      await adyenOrganisationDetailsSchema.organisationName.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.true
    })

    it('should fail validation if organisationName is empty', async () => {
      const req = { body: { organisationName: '  ' } }

      await adyenOrganisationDetailsSchema.organisationName.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()).to.deep.include({
        type: 'field',
        value: '',
        msg: 'Enter an organisation name',
        path: 'organisationName',
        location: 'body',
      })
    })

    it('should fail validation if organisationName is more than 100 characters', async () => {
      const req = { body: { organisationName: 'a'.repeat(101) } }

      await adyenOrganisationDetailsSchema.organisationName.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()).to.deep.include({
        type: 'field',
        value: 'a'.repeat(101),
        msg: 'Organisation name must be 100 characters or fewer',
        path: 'organisationName',
        location: 'body',
      })
    })

    const forbiddenCharacters = [
      { organisationName: 'spring < terrace', value: 'spring < terrace' },
      { organisationName: 'spring &gt; terrace', value: 'spring > terrace' },
      { organisationName: 'spring | terrace', value: 'spring | terrace' },
    ]
    forbiddenCharacters.forEach(({ organisationName, value }) => {
      it(`should fail validation when organisationName contains forbidden characters: ${organisationName}`, async () => {
        const req = { body: { organisationName } }

        await adyenOrganisationDetailsSchema.organisationName.validate.run(req)
        const errors = validationResult(req)

        expect(errors.isEmpty()).to.be.false
        expect(errors.array()).to.deep.include({
          type: 'field',
          value,
          msg: 'You cannot use any of the following characters < > | in the organisation name',
          path: 'organisationName',
          location: 'body',
        })
      })
    })
  })

  describe('addressLine1', () => {
    it('should pass validation when addressLine1 is provided', async () => {
      const req = { body: { addressLine1: '5 Spring Terrace' } }

      await adyenOrganisationDetailsSchema.organisationAddress.line1.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.true
    })

    it('should fail validation when addressLine1 is empty', async () => {
      const req = { body: { addressLine1: '' } }

      await adyenOrganisationDetailsSchema.organisationAddress.line1.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()).to.deep.include({
        type: 'field',
        value: '',
        msg: 'Enter address line 1',
        path: 'addressLine1',
        location: 'body',
      })
    })

    it('should fail validation when addressLine1 is fewer than 3 characters', async () => {
      const req = { body: { addressLine1: 'ab' } }

      await adyenOrganisationDetailsSchema.organisationAddress.line1.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()).to.deep.include({
        type: 'field',
        value: 'ab',
        msg: 'Address line 1 must be 3 characters or more',
        path: 'addressLine1',
        location: 'body',
      })
    })

    it('should fail validation when addressLine1 is more than 255 characters', async () => {
      const req = { body: { addressLine1: 'a'.repeat(256) } }

      await adyenOrganisationDetailsSchema.organisationAddress.line1.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()).to.deep.include({
        type: 'field',
        value: 'a'.repeat(256),
        msg: 'Address line 1 must be 255 characters or fewer',
        path: 'addressLine1',
        location: 'body',
      })
    })

    it('should fail validation when addressLine1 is only numbers', async () => {
      const req = { body: { addressLine1: '742' } }

      await adyenOrganisationDetailsSchema.organisationAddress.line1.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()).to.deep.include({
        type: 'field',
        value: '742',
        msg: 'Address line 1 must include the building and street',
        path: 'addressLine1',
        location: 'body',
      })
    })

    it('should fail validation when addressLine1 contains forbidden characters', async () => {
      const req = { body: { addressLine1: '<script>alert("XSS!");</script>' } }

      await adyenOrganisationDetailsSchema.organisationAddress.line1.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()).to.deep.include({
        type: 'field',
        value: '<script>alert("XSS!");</script>',
        msg: 'You cannot use any of the following characters < > | in address line 1',
        path: 'addressLine1',
        location: 'body',
      })
    })
  })

  describe('addressLine2', () => {
    it('should pass validation when addressLine2 is empty', async () => {
      const req = { body: { addressLine2: '' } }

      await adyenOrganisationDetailsSchema.organisationAddress.line2.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.true
    })

    it('should fail validation when addressLine2 is more than 255 characters', async () => {
      const req = { body: { addressLine2: 'a'.repeat(256) } }

      await adyenOrganisationDetailsSchema.organisationAddress.line2.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()).to.deep.include({
        type: 'field',
        value: 'a'.repeat(256),
        msg: 'Address line 2 must be 255 characters or fewer',
        path: 'addressLine2',
        location: 'body',
      })
    })

    it('should fail validation when addressLine2 contains forbidden characters', async () => {
      const req = { body: { addressLine2: 'spring | terrace' } }

      await adyenOrganisationDetailsSchema.organisationAddress.line2.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()).to.deep.include({
        type: 'field',
        value: 'spring | terrace',
        msg: 'You cannot use any of the following characters < > | in address line 2',
        path: 'addressLine2',
        location: 'body',
      })
    })
  })

  describe('addressCity', () => {
    it('should pass validation when addressCity is provided', async () => {
      const req = { body: { addressCity: 'Swansea' } }

      await adyenOrganisationDetailsSchema.organisationAddress.city.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.true
    })

    it('should fail validation when addressCity is empty', async () => {
      const req = { body: { addressCity: '' } }

      await adyenOrganisationDetailsSchema.organisationAddress.city.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()).to.deep.include({
        type: 'field',
        value: '',
        msg: 'Enter a town or city',
        path: 'addressCity',
        location: 'body',
      })
    })

    it('should fail validation when addressCity is fewer than 3 characters', async () => {
      const req = { body: { addressCity: 'ab' } }

      await adyenOrganisationDetailsSchema.organisationAddress.city.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()).to.deep.include({
        type: 'field',
        value: 'ab',
        msg: 'Town or city must be 3 characters or more',
        path: 'addressCity',
        location: 'body',
      })
    })

    it('should fail validation when addressCity is more than 255 characters', async () => {
      const req = { body: { addressCity: 'a'.repeat(256) } }

      await adyenOrganisationDetailsSchema.organisationAddress.city.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()).to.deep.include({
        type: 'field',
        value: 'a'.repeat(256),
        msg: 'Town or city must be 255 characters or fewer',
        path: 'addressCity',
        location: 'body',
      })
    })

    it('should fail validation when addressCity is only numbers', async () => {
      const req = { body: { addressCity: '12345' } }

      await adyenOrganisationDetailsSchema.organisationAddress.city.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()).to.deep.include({
        type: 'field',
        value: '12345',
        msg: 'Town or city cannot contain only numbers',
        path: 'addressCity',
        location: 'body',
      })
    })

    it('should fail validation when addressCity contains forbidden characters', async () => {
      const req = { body: { addressCity: 'spring>terrace' } }

      await adyenOrganisationDetailsSchema.organisationAddress.city.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()).to.deep.include({
        type: 'field',
        value: 'spring>terrace',
        msg: 'You cannot use any of the following characters < > | in the town or city',
        path: 'addressCity',
        location: 'body',
      })
    })
  })

  describe('addressCountry', () => {
    it('should pass validation when addressCountry is provided', async () => {
      const req = { body: { addressCountry: 'GB' } }

      await adyenOrganisationDetailsSchema.organisationAddress.country.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.true
    })

    it('should fail validation when addressCountry is empty', async () => {
      const req = { body: { addressCountry: '' } }

      await adyenOrganisationDetailsSchema.organisationAddress.country.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()).to.deep.include({
        type: 'field',
        value: '',
        msg: 'Select a country',
        path: 'addressCountry',
        location: 'body',
      })
    })

    it('should fail validation when addressCountry is not a 2 character country code', async () => {
      const req = { body: { addressCountry: 'GBR' } }

      await adyenOrganisationDetailsSchema.organisationAddress.country.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()).to.deep.include({
        type: 'field',
        value: 'GBR',
        msg: 'Select a country',
        path: 'addressCountry',
        location: 'body',
      })
    })
  })

  describe('addressPostcode', () => {
    it('should fail validation when addressPostcode is empty', async () => {
      const req = { body: { addressPostcode: '', addressCountry: 'GB' } }

      await adyenOrganisationDetailsSchema.organisationAddress.postcode.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()).to.deep.include({
        type: 'field',
        value: '',
        msg: 'Enter a postcode',
        path: 'addressPostcode',
        location: 'body',
      })
    })

    it('should fail validation when addressPostcode is not a real GB postcode', async () => {
      const req = { body: { addressPostcode: 'not a postcode', addressCountry: 'GB' } }

      await adyenOrganisationDetailsSchema.organisationAddress.postcode.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()).to.deep.include({
        type: 'field',
        value: 'NOT A POSTCODE',
        msg: 'Enter a real postcode',
        path: 'addressPostcode',
        location: 'body',
      })
    })

    it('should pass validation when addressPostcode is not a GB postcode and addressCountry is not GB', async () => {
      const req = { body: { addressPostcode: 'not a postcode', addressCountry: 'US' } }

      await adyenOrganisationDetailsSchema.organisationAddress.postcode.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.true
    })

    it('should convert addressPostcode to uppercase', async () => {
      const req = { body: { addressPostcode: 'sw1a 1aa', addressCountry: 'GB' } }

      await adyenOrganisationDetailsSchema.organisationAddress.postcode.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.true
      expect(req.body.addressPostcode).to.equal('SW1A 1AA')
    })

    const validPostcodes = ['SW1A 1AA', 'SW1A1AA']
    validPostcodes.forEach((addressPostcode) => {
      it(`should pass validation when addressPostcode is valid: ${addressPostcode}`, async () => {
        const req = { body: { addressPostcode, addressCountry: 'GB' } }

        await adyenOrganisationDetailsSchema.organisationAddress.postcode.validate.run(req)
        const errors = validationResult(req)

        expect(errors.isEmpty()).to.be.true
      })
    })

    const invalidPostcodes = ['INVALID', '123 456', 'ABC DEF', 'SW1A 1AAA']
    invalidPostcodes.forEach((addressPostcode) => {
      it(`should fail validation when addressPostcode is invalid: ${addressPostcode}`, async () => {
        const req = { body: { addressPostcode, addressCountry: 'GB' } }

        await adyenOrganisationDetailsSchema.organisationAddress.postcode.validate.run(req)
        const errors = validationResult(req)

        expect(errors.isEmpty()).to.be.false
        expect(errors.array()).to.deep.include({
          type: 'field',
          value: addressPostcode,
          msg: 'Enter a real postcode',
          path: 'addressPostcode',
          location: 'body',
        })
      })
    })
  })

  describe('email', () => {
    it('should pass validation when email is provided', async () => {
      const req = { body: { email: 'pay@test.com' } }

      await adyenOrganisationDetailsSchema.email.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.true
    })

    it('should fail validation when email is empty', async () => {
      const req = { body: { email: '' } }

      await adyenOrganisationDetailsSchema.email.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()).to.deep.include({
        type: 'field',
        value: '',
        msg: 'Enter an email address',
        path: 'email',
        location: 'body',
      })
    })

    it('should fail validation when email is not a real email address', async () => {
      const req = { body: { email: 'no-email' } }

      await adyenOrganisationDetailsSchema.email.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()).to.deep.include({
        type: 'field',
        value: 'no-email',
        msg: 'Enter a real email address',
        path: 'email',
        location: 'body',
      })
    })
  })

  describe('hasCompanyRegistrationNumber', () => {
    it('should pass validation when hasCompanyRegistrationNumber is true', async () => {
      const req = { body: { hasCompanyRegistrationNumber: 'true' } }

      await adyenOrganisationDetailsSchema.hasCompanyRegistrationNumber.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.true
    })

    it('should pass validation when hasCompanyRegistrationNumber is false', async () => {
      const req = { body: { hasCompanyRegistrationNumber: 'false' } }

      await adyenOrganisationDetailsSchema.hasCompanyRegistrationNumber.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.true
    })

    it('should fail validation when hasCompanyRegistrationNumber is empty', async () => {
      const req = { body: { hasCompanyRegistrationNumber: '' } }

      await adyenOrganisationDetailsSchema.hasCompanyRegistrationNumber.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()).to.deep.include({
        type: 'field',
        value: '',
        msg: 'Select yes if your organisation has a company registration number',
        path: 'hasCompanyRegistrationNumber',
        location: 'body',
      })
    })
  })
})
