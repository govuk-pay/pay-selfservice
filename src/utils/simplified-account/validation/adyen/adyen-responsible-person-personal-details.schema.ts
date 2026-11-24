import { body, CustomValidator, ValidationChain } from 'express-validator'
import { Request } from 'express'

const HAS_NUMBER_OR_SPECIAL_CHARACTER_REGEX = /^[^0-9<>@#$%^&*_=+{}\[\]\\|/]+$/

export interface ResponsiblePersonPersonalDetailsBody {
  firstName: string
  lastName: string
  dobDay: string
  dobMonth: string
  dobYear: string
}

function isRealDate(day: string, month: string, year: string): boolean {
  const d = Number(day)
  const m = Number(month) - 1
  const y = Number(year)

  // Javascript dates will roll over if the date is invalid, so we check the date we created matches the input values
  const date = new Date(y, m, d)
  return date.getFullYear() === y && date.getMonth() === m && date.getDate() === d
}

const notAllDateFieldsBlank: CustomValidator = (_value: unknown, meta) => {
  const req = meta.req as Request<unknown, unknown, { dobDay: string; dobMonth: string; dobYear: string }>
  const { dobDay, dobMonth, dobYear } = req.body
  return [dobDay, dobMonth, dobYear].some((field: unknown) => Boolean(field?.toString().trim()))
}

const dobDay = {
  validate: body('dobDay')
    .if(notAllDateFieldsBlank)
    .trim()
    .notEmpty()
    .withMessage('Date of birth must include a day')
    .bail()
    .isInt({ min: 1, max: 31 })
    .withMessage('Day of birth must be a number between 1 and 31'),
}

const dobMonth = {
  validate: body('dobMonth')
    .if(notAllDateFieldsBlank)
    .trim()
    .notEmpty()
    .withMessage('Date of birth must include a month')
    .bail()
    .isInt({ min: 1, max: 12 })
    .withMessage('Month of birth must be a number between 1 and 12'),
}

const dobYear = {
  validate: body('dobYear')
    .if(notAllDateFieldsBlank)
    .trim()
    .notEmpty()
    .withMessage('Date of birth must include a year')
    .bail()
    .matches(/^\d{4}$/)
    .withMessage('Year must include 4 numbers'),
}

const adyenResponsiblePersonPersonalDetailsSchema = {
  firstName: {
    validate: body('firstName')
      .notEmpty()
      .withMessage('Enter the first name')
      .bail()
      .isLength({ max: 100 })
      .withMessage('First name must be 100 characters or fewer')
      .bail()
      .matches(HAS_NUMBER_OR_SPECIAL_CHARACTER_REGEX)
      .withMessage('First name must not contain numbers or special characters'),
  },
  lastName: {
    validate: body('lastName')
      .notEmpty()
      .withMessage('Enter the last name')
      .bail()
      .isLength({ max: 100 })
      .withMessage('Last name must be 100 characters or fewer')
      .bail()
      .matches(HAS_NUMBER_OR_SPECIAL_CHARACTER_REGEX)
      .withMessage('Last name must not contain numbers or special characters'),
  },
  dob: {
    validate: body('dob')
      .custom(notAllDateFieldsBlank)
      .withMessage('Enter the date of birth')
      .bail()
      .if(dobDay.validate)
      .if(dobMonth.validate)
      .if(dobYear.validate)
      .custom((_value, meta) => {
        const req = meta.req as Request<unknown, unknown, { dobDay: string; dobMonth: string; dobYear: string }>
        const { dobDay, dobMonth, dobYear } = req.body

        return isRealDate(dobDay, dobMonth, dobYear)
      })
      .withMessage('Date of birth must be a real date')
      .bail(),
    dobDay,
    dobMonth,
    dobYear,
  },
}

export { adyenResponsiblePersonPersonalDetailsSchema }
