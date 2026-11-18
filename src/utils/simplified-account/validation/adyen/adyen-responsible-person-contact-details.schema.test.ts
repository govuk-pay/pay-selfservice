import {
  adyenResponsiblePersonContactDetailsSchema,
  ADYEN_RESPONSIBLE_PERSON_CONTACT_DETAILS_VALIDATIONS,
} from './adyen-responsible-person-contact-details.schema'
import { validationResult } from 'express-validator'
import { expect } from 'chai'

describe('adyenResponsiblePersonContactDetailsSchema', () => {
  describe('ADYEN_RESPONSIBLE_PERSON_CONTACT_DETAILS_VALIDATIONS', () => {
    it('should pass validation when all fields are valid', async () => {
      const req = { body: { telephoneNumber: '01234 567890', email: 'dan@example.com' } }

      await Promise.all(ADYEN_RESPONSIBLE_PERSON_CONTACT_DETAILS_VALIDATIONS.map((validation) => validation.run(req)))
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.true
    })

    it('should fail validation for every field when the body is empty', async () => {
      const req = { body: {} }

      await Promise.all(ADYEN_RESPONSIBLE_PERSON_CONTACT_DETAILS_VALIDATIONS.map((validation) => validation.run(req)))
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array().map((error) => (error.type === 'field' ? error.path : undefined))).to.have.members([
        'telephoneNumber',
        'email',
      ])
    })
  })

  describe('telephoneNumber', () => {
    const validTelephoneNumbers = ['0113 123 0000', '01200 123900', '+44 0121 123 0123', '0113-123-0000']
    validTelephoneNumbers.forEach((telephoneNumber) => {
      it(`should pass validation when telephoneNumber is: ${telephoneNumber}`, async () => {
        const req = { body: { telephoneNumber } }

        await adyenResponsiblePersonContactDetailsSchema.telephoneNumber.validate.run(req)
        const errors = validationResult(req)

        expect(errors.isEmpty()).to.be.true
      })
    })

    it('should fail validation when telephoneNumber is empty', async () => {
      const req = { body: { telephoneNumber: '  ' } }

      await adyenResponsiblePersonContactDetailsSchema.telephoneNumber.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()).to.deep.include({
        type: 'field',
        value: '',
        msg: 'Enter a telephone number',
        path: 'telephoneNumber',
        location: 'body',
      })
    })

    const invalidTelephoneNumbers = ['abc', '12345678']
    invalidTelephoneNumbers.forEach((telephoneNumber) => {
      it(`should fail validation when telephoneNumber is invalid: ${telephoneNumber}`, async () => {
        const req = { body: { telephoneNumber } }

        await adyenResponsiblePersonContactDetailsSchema.telephoneNumber.validate.run(req)
        const errors = validationResult(req)

        expect(errors.isEmpty()).to.be.false
        expect(errors.array()).to.deep.include({
          type: 'field',
          value: telephoneNumber,
          msg: 'Enter a telephone number, like 01632 960 001, 07700 900 982 or +44 0808 157 0192',
          path: 'telephoneNumber',
          location: 'body',
        })
      })
    })
  })

  describe('email', () => {
    it('should pass validation when email is valid', async () => {
      const req = { body: { email: 'dan@example.com' } }

      await adyenResponsiblePersonContactDetailsSchema.email.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.true
    })

    it('should fail validation when email is empty', async () => {
      const req = { body: { email: '' } }

      await adyenResponsiblePersonContactDetailsSchema.email.validate.run(req)
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

      await adyenResponsiblePersonContactDetailsSchema.email.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()).to.deep.include({
        type: 'field',
        value: 'invalid-email',
        msg: 'Enter a real email address',
        path: 'email',
        location: 'body',
      })
    })
  })
})
