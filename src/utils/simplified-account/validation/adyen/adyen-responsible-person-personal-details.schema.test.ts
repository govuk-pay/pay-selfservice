import { expect } from 'chai'
import { adyenResponsiblePersonPersonalDetailsSchema } from './adyen-responsible-person-personal-details.schema'
import { validationResult } from 'express-validator'

describe('Adyen responsible persion - personal detail - Schema Validation', () => {
  describe('First name validation', () => {
    it('should pass with valid first name', async () => {
      const req = {
        body: {
          firstName: 'John',
        },
      }

      await adyenResponsiblePersonPersonalDetailsSchema.details.firstName.validate.run(req)
      expect(validationResult(req).isEmpty()).to.be.true
    })

    it('should fail with empty first name', async () => {
      const req = {
        body: {
          firstName: '',
        },
      }

      await adyenResponsiblePersonPersonalDetailsSchema.details.firstName.validate.run(req)

      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()[0].msg).to.equal('Enter the first name')
    })

    it('should fail with first name > 100', async () => {
      const req = {
        body: {
          firstName: 'a'.repeat(101),
        },
      }

      await adyenResponsiblePersonPersonalDetailsSchema.details.firstName.validate.run(req)

      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()[0].msg).to.equal('First name must be 100 characters or fewer')
    })

    it('should fail with first name containing a number', async () => {
      const req = {
        body: {
          firstName: 'test1',
        },
      }

      await adyenResponsiblePersonPersonalDetailsSchema.details.firstName.validate.run(req)

      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()[0].msg).to.equal('First name must not contain numbers or special characters')
    })

    it('should fail with first name containing a special character', async () => {
      const req = {
        body: {
          firstName: 'test&',
        },
      }

      await adyenResponsiblePersonPersonalDetailsSchema.details.firstName.validate.run(req)

      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()[0].msg).to.equal('First name must not contain numbers or special characters')
    })
  })

  describe('Last name validation', () => {
    it('should pass with valid last name', async () => {
      const req = {
        body: {
          lastName: 'Doe',
        },
      }

      await adyenResponsiblePersonPersonalDetailsSchema.details.lastName.validate.run(req)
      expect(validationResult(req).isEmpty()).to.be.true
    })

    it('should fail with empty last name', async () => {
      const req = {
        body: {
          lastName: '',
        },
      }

      await adyenResponsiblePersonPersonalDetailsSchema.details.lastName.validate.run(req)

      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()[0].msg).to.equal('Enter the last name')
    })

    it('should fail with first name > 100', async () => {
      const req = {
        body: {
          lastName: 'a'.repeat(101),
        },
      }

      await adyenResponsiblePersonPersonalDetailsSchema.details.lastName.validate.run(req)

      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()[0].msg).to.equal('Last name must be 100 characters or fewer')
    })

    it('should fail with last name containing a number', async () => {
      const req = {
        body: {
          lastName: 'test1',
        },
      }

      await adyenResponsiblePersonPersonalDetailsSchema.details.lastName.validate.run(req)

      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()[0].msg).to.equal('Last name must not contain numbers or special characters')
    })

    it('should fail with last name containing a special character', async () => {
      const req = {
        body: {
          lastName: 'test&',
        },
      }

      await adyenResponsiblePersonPersonalDetailsSchema.details.lastName.validate.run(req)

      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()[0].msg).to.equal('Last name must not contain numbers or special characters')
    })
  })

  describe.only('dob', () => {
    context('when given blank day, month and year', () => {
      ;[
        { dobDay: '', dobMonth: '', dobYear: '' },
        { dobDay: '    ', dobMonth: ' ', dobYear: '' },
      ].forEach((dob) => {
        it(`should return invalid when whole date is missig: "${dob.dobDay}" "${dob.dobMonth}" "${dob.dobYear}"`, async () => {
          const req = { body: { ...dob } }

          await adyenResponsiblePersonPersonalDetailsSchema.dob.validate.run(req)
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

          await adyenResponsiblePersonPersonalDetailsSchema.dob.validate.run(req)
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

          await adyenResponsiblePersonPersonalDetailsSchema.dob.validate.run(req)
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

          await adyenResponsiblePersonPersonalDetailsSchema.dob.validate.run(req)
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
  })

  describe.only('dobDay', () => {
    it('should return not return an error when all values are empty', async () => {
      const req = { body: { dobDay: '', dobMonth: '', dobYear: '' } }

      await adyenResponsiblePersonPersonalDetailsSchema.dob.dobDay.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.true
    })

    it('should return the correct error message when day is empty but month and year are filled', async () => {
      const req = { body: { dobDay: '', dobMonth: '02', dobYear: '1999' } }

      await adyenResponsiblePersonPersonalDetailsSchema.dob.dobDay.validate.run(req)
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

      await adyenResponsiblePersonPersonalDetailsSchema.dob.dobMonth.validate.run(req)
      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.true
    })

    it('should return the correct error message when month is empty but day and year are filled', async () => {
      const req = { body: { dobDay: '12', dobMonth: '', dobYear: '1999' } }

      await adyenResponsiblePersonPersonalDetailsSchema.dob.dobMonth.validate.run(req)
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
})
