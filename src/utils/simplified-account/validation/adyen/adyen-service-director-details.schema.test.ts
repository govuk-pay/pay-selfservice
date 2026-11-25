import {
  adyenServiceDirectorDetailsSchema,
  // ADYEN_SERVICE_DIRECTOR_DETAILS_VALIDATIONS,
} from './adyen-service-director-details.schema'
import { validationResult } from 'express-validator'
import { expect } from 'chai'

describe('adyenServiceDirectorDetailsSchema', () => {
  describe('firstName', () => {
    it('should pass validation when firstName is valid', async () => {
      const req = { body: { firstName: 'Dan' } }

      await adyenServiceDirectorDetailsSchema.firstName.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.true
    })

    it('should fail validation when firstName is empty', async () => {
      const req = { body: { firstName: '  ' } }

      await adyenServiceDirectorDetailsSchema.firstName.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()).to.deep.include({
        type: 'field',
        value: '',
        msg: 'Enter the service director’s first name',
        path: 'firstName',
        location: 'body',
      })
    })

    it('should fail if the firstName is too long', async () => {
      const req = { body: { firstName: 'x'.repeat(101) } }

      await adyenServiceDirectorDetailsSchema.firstName.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()).to.deep.include({
        type: 'field',
        value: 'x'.repeat(101),
        msg: 'First name must be 100 characters or fewer',
        path: 'firstName',
        location: 'body',
      })
    })

    it('should fail if firstName includes invalid characters', async () => {
      const req = { body: { firstName: 'super*' } }

      await adyenServiceDirectorDetailsSchema.firstName.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()).to.deep.include({
        type: 'field',
        value: 'super*',
        msg: 'First name must not contain numbers or special characters',
        path: 'firstName',
        location: 'body',
      })
    })
  })

  describe('lastName', () => {
    it('should pass validation when lastName is valid', async () => {
      const req = { body: { lastName: 'Smith' } }

      await adyenServiceDirectorDetailsSchema.lastName.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.true
    })

    it('should fail validation when lastName is empty', async () => {
      const req = { body: { lastName: '  ' } }

      await adyenServiceDirectorDetailsSchema.lastName.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()).to.deep.include({
        type: 'field',
        value: '',
        msg: 'Enter the service director’s last name',
        path: 'lastName',
        location: 'body',
      })
    })

    it('should fail if the lastName is too long', async () => {
      const req = { body: { lastName: 'x'.repeat(101) } }

      await adyenServiceDirectorDetailsSchema.lastName.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()).to.deep.include({
        type: 'field',
        value: 'x'.repeat(101),
        msg: 'First name must be 100 characters or fewer',
        path: 'lastName',
        location: 'body',
      })
    })

    it('should fail if the lastName includes invalid characters', async () => {
      const req = { body: { lastName: 'super*' } }

      await adyenServiceDirectorDetailsSchema.lastName.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()).to.deep.include({
        type: 'field',
        value: 'super*',
        msg: 'First name must not contain numbers or special characters',
        path: 'lastName',
        location: 'body',
      })
    })
  })

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

  describe('dob', () => {
    context('when the day, month, and year are blank', () => {
      ;[
        { dobDay: '', dobMonth: '', dobYear: '' },
        { dobDay: '    ', dobMonth: ' ', dobYear: '' },
      ].forEach((dob) => {
        it(`should return invalid when whole date is missig: "${dob.dobDay}" "${dob.dobMonth}" "${dob.dobYear}"`, async () => {
          const req = { body: { ...dob } }

          await adyenServiceDirectorDetailsSchema.dob.validate.run(req)
          const errors = validationResult(req)

          expect(errors.isEmpty()).to.be.false
          expect(errors.array()[0]).to.deep.equal({
            type: 'field',
            msg: 'Enter the date of birth',
            path: 'dob',
            location: 'body',
            value: undefined,
          })
        })
      })
    })
    context('when given invalid day, month or year', () => {
      ;[
        { dobDay: '23', dobMonth: 'aa', dobYear: '19' },
        { dobDay: '    ', dobMonth: 'x', dobYear: '' },
      ].forEach((dob) => {
        it(`should pass validation when dob is: "${dob.dobDay}" "${dob.dobMonth}" "${dob.dobYear}"`, async () => {
          const req = { body: { ...dob } }

          await adyenServiceDirectorDetailsSchema.dob.validate.run(req)
          const errors = validationResult(req)

          expect(errors.isEmpty()).to.be.true
        })
      })
    })
    context('when given valid day, month and year', () => {
      ;[
        { dobDay: '12', dobMonth: '02', dobYear: '1999' },
        { dobDay: '29', dobMonth: '02', dobYear: '2024' },
      ].forEach((dob) => {
        it(`should pass validation when dob is: ${dob.dobDay} ${dob.dobMonth} ${dob.dobYear}`, async () => {
          const req = { body: { ...dob } }

          await adyenServiceDirectorDetailsSchema.dob.validate.run(req)
          const errors = validationResult(req)

          expect(errors.isEmpty()).to.be.true
        })
      })

      ;[
        { dobDay: '31', dobMonth: '04', dobYear: '1999' },
        { dobDay: '29', dobMonth: '02', dobYear: '2023' },
      ].forEach((dob) => {
        it(`should fail validation when dob is: ${dob.dobDay} ${dob.dobMonth} ${dob.dobYear}`, async () => {
          const req = { body: { ...dob } }

          await adyenServiceDirectorDetailsSchema.dob.validate.run(req)
          const errors = validationResult(req)

          expect(errors.isEmpty()).to.be.false
          expect(errors.array()[0]).to.deep.equal({
            type: 'field',
            msg: 'Date of birth must be a real date',
            path: 'dob',
            location: 'body',
            value: undefined,
          })
        })
      })
    })

    describe('dobDay', () => {
      it('should return not return an error when all values are empty', async () => {
        const req = { body: { dobDay: '', dobMonth: '', dobYear: '' } }

        await adyenServiceDirectorDetailsSchema.dob.dobDay.validate.run(req)
        const errors = validationResult(req)

        expect(errors.isEmpty()).to.be.true
      })

      it('should return the correct error message when day is empty but month and year are filled', async () => {
        const req = { body: { dobDay: '', dobMonth: '02', dobYear: '1999' } }

        await adyenServiceDirectorDetailsSchema.dob.dobDay.validate.run(req)
        const errors = validationResult(req)

        expect(errors.isEmpty()).to.be.false
        expect(errors.array()[0]).to.deep.equal({
          type: 'field',
          msg: 'Date of birth must include a day',
          path: 'dobDay',
          location: 'body',
          value: '',
        })
      })
    })

    describe('dobMonth', () => {
      it('should return not return an error when all values are empty', async () => {
        const req = { body: { dobDay: '', dobMonth: '', dobYear: '' } }

        await adyenServiceDirectorDetailsSchema.dob.dobMonth.validate.run(req)
        const errors = validationResult(req)

        expect(errors.isEmpty()).to.be.true
      })

      it('should return the correct error message when month is empty but day and year are filled', async () => {
        const req = { body: { dobDay: '12', dobMonth: '', dobYear: '1999' } }

        await adyenServiceDirectorDetailsSchema.dob.dobMonth.validate.run(req)
        const errors = validationResult(req)

        expect(errors.isEmpty()).to.be.false
        expect(errors.array()[0]).to.deep.equal({
          type: 'field',
          msg: 'Date of birth must include a month',
          path: 'dobMonth',
          location: 'body',
          value: '',
        })
      })
    })

    describe('dobYear', () => {
      it('should return not return an error when all values are empty', async () => {
        const req = { body: { dobDay: '', dobMonth: '', dobYear: '' } }

        await adyenServiceDirectorDetailsSchema.dob.dobYear.validate.run(req)
        const errors = validationResult(req)

        expect(errors.isEmpty()).to.be.true
      })

      it('should return the correct error message when year is empty but day and month are filled', async () => {
        const req = { body: { dobDay: '12', dobMonth: '06', dobYear: '' } }

        await adyenServiceDirectorDetailsSchema.dob.dobYear.validate.run(req)
        const errors = validationResult(req)

        expect(errors.isEmpty()).to.be.false
        expect(errors.array()[0]).to.deep.equal({
          type: 'field',
          msg: 'Date of birth must include a year',
          path: 'dobYear',
          location: 'body',
          value: '',
        })
      })
    })
  })
})
