import { body, CustomValidator, ValidationChain } from 'express-validator'
import { Request } from 'express'
import { DateTime } from 'luxon'

const HAS_NUMBER_OR_SPECIAL_CHARACTER_REGEX = /^[^0-9<>@#$%^&*_=+{}[\]\\|/]+$/

const isRealDate: CustomValidator = (_value, meta) => {
  const req = meta.req as Request<unknown, unknown, { dobDay: string; dobMonth: string; dobYear: string }>
  const { dobDay, dobMonth, dobYear } = req.body

  return DateTime.fromObject({
    day: Number(dobDay),
    month: Number(dobMonth),
    year: Number(dobYear),
  }).isValid
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

const createNameValidator = (fieldId: string, fieldLabel: string, role: string): ValidationChain => {
  const capitalisedFieldname = fieldLabel.charAt(0).toUpperCase() + fieldLabel.slice(1).toLowerCase()

  return body(fieldId)
    .trim()
    .notEmpty()
    .withMessage(`Enter the ${role.toLowerCase()}’s ${fieldLabel.toLowerCase()}`)
    .bail()
    .isLength({ max: 100 })
    .withMessage(`${capitalisedFieldname} must be 100 characters or fewer`)
    .bail()
    .matches(HAS_NUMBER_OR_SPECIAL_CHARACTER_REGEX)
    .withMessage(`${capitalisedFieldname} must not contain numbers or special characters`)
}

const createSharedSchema = (role: string) => ({
  firstName: {
    validate: createNameValidator('firstName', 'first name', role),
  },
  lastName: {
    validate: createNameValidator('lastName', 'last name', role),
  },
  dob: {
    validate: body('dob')
      .custom(notAllDateFieldsBlank)
      .withMessage('Enter the date of birth')
      .bail()
      .if(dobDay.validate)
      .if(dobMonth.validate)
      .if(dobYear.validate)
      .custom(isRealDate)
      .withMessage('Date of birth must be a real date')
      .bail(),
    dobDay,
    dobMonth,
    dobYear,
  },
  email: {
    validate: body('email')
      .trim()
      .notEmpty()
      .withMessage('Enter a work email address')
      .bail()
      .isEmail()
      .withMessage('Enter a valid email address'),
  },
})

export { createSharedSchema }
