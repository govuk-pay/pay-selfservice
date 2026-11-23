import { expect } from 'chai'
import { adyenResponsiblePersonPersonalDetailsSchema } from './adyen-responsible-person-personal-details.schema'
import { validationResult } from 'express-validator'
import { first } from 'node_modules/cheerio/lib/api/traversing'

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

  describe('DOB day validation', () => {
    it('should pass with a valid DOB day', async () => {
      const req = {
        body: {
          dobDay: '10',
        },
      }

      await adyenResponsiblePersonPersonalDetailsSchema.details.dobDay.validate.run(req)

      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.true
    })
  })

  describe('DOB day validation', () => {
    it('should pass with a valid DOB day', async () => {
      const req = {
        body: {
          dobDay: '10',
        },
      }

      await adyenResponsiblePersonPersonalDetailsSchema.details.dobDay.validate.run(req)

      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.true
    })

    it('should fail with an empty DOB day', async () => {
      const req = {
        body: {
          dobDay: '',
        },
      }

      await adyenResponsiblePersonPersonalDetailsSchema.details.dobDay.validate.run(req)

      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()[0].msg).to.equal('Date of birth must include a day')
    })

    it('should fail with a DOB day < 1', async () => {
      const req = {
        body: {
          dobDay: '0',
        },
      }

      await adyenResponsiblePersonPersonalDetailsSchema.details.dobDay.validate.run(req)

      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()[0].msg).to.equal('Day of birth must be a number between 1 and 31')
    })

    it('should fail with a DOB day > 31', async () => {
      const req = {
        body: {
          dobDay: '32',
        },
      }

      await adyenResponsiblePersonPersonalDetailsSchema.details.dobDay.validate.run(req)

      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()[0].msg).to.equal('Day of birth must be a number between 1 and 31')
    })
  })

  describe('DOB month validation', () => {
    it('should pass with a valid DOB month', async () => {
      const req = {
        body: {
          dobMonth: '10',
        },
      }

      await adyenResponsiblePersonPersonalDetailsSchema.details.dobMonth.validate.run(req)

      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.true
    })

    it('should fail with an empty DOB month', async () => {
      const req = {
        body: {
          dobMonth: '',
        },
      }

      await adyenResponsiblePersonPersonalDetailsSchema.details.dobMonth.validate.run(req)

      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()[0].msg).to.equal('Date of birth must include a month')
    })

    it('should fail with a DOB month < 1', async () => {
      const req = {
        body: {
          dobMonth: '0',
        },
      }

      await adyenResponsiblePersonPersonalDetailsSchema.details.dobMonth.validate.run(req)

      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()[0].msg).to.equal('Month of birth must be a number between 1 and 12')
    })

    it('should fail with a DOB month > 12', async () => {
      const req = {
        body: {
          dobMonth: '13',
        },
      }

      await adyenResponsiblePersonPersonalDetailsSchema.details.dobMonth.validate.run(req)

      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()[0].msg).to.equal('Month of birth must be a number between 1 and 12')
    })
  })

  describe('DOB year validation', () => {
    it('should pass with a valid DOB year', async () => {
      const req = {
        body: {
          dobYear: '2025',
        },
      }

      await adyenResponsiblePersonPersonalDetailsSchema.details.dobYear.validate.run(req)

      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.true
    })

    it('should fail with an empty DOB year', async () => {
      const req = {
        body: {
          dobYear: '',
        },
      }

      await adyenResponsiblePersonPersonalDetailsSchema.details.dobYear.validate.run(req)

      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()[0].msg).to.equal('Date of birth must include a year')
    })

    it('should fail with a DOB year < 1900', async () => {
      const req = {
        body: {
          dobYear: '1899',
        },
      }

      await adyenResponsiblePersonPersonalDetailsSchema.details.dobYear.validate.run(req)

      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()[0].msg).to.equal('Enter a valid year of birth')
    })

    it('should fail with a DOB year > current year', async () => {
      const CURRENT_YEAR = new Date().getFullYear()
      const NEXT_YEAR = CURRENT_YEAR + 1

      const req = {
        body: {
          dobYear: NEXT_YEAR,
        },
      }

      await adyenResponsiblePersonPersonalDetailsSchema.details.dobYear.validate.run(req)

      const errors = validationResult(req)

      expect(errors.isEmpty()).to.be.false
      expect(errors.array()[0].msg).to.equal('Enter a valid year of birth')
    })
  })
})
