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

const adyenServiceDirectorDetailsSchema = {
  firstName: {
    validate: body('firstName')
      .trim()
      .notEmpty()
      .withMessage('Enter the service director’s first name')
      .bail()
      .isLength({ max: 100 })
      .withMessage('First name must be 100 characters or fewer')
      .bail()
      .matches(HAS_NUMBER_OR_SPECIAL_CHARACTER_REGEX)
      .withMessage('First name must not contain numbers or special characters'),
  },
  lastName: {
    validate: body('lastName')
      .trim()
      .notEmpty()
      .withMessage('Enter the service director’s last name')
      .bail()
      .isLength({ max: 100 })
      .withMessage('First name must be 100 characters or fewer')
      .bail()
      .matches(HAS_NUMBER_OR_SPECIAL_CHARACTER_REGEX)
      .withMessage('First name must not contain numbers or special characters'),
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
}

const ADYEN_SERVICE_DIRECTOR_DETAILS_VALIDATIONS: ValidationChain[] = [
  adyenServiceDirectorDetailsSchema.firstName.validate,
  adyenServiceDirectorDetailsSchema.lastName.validate,
  adyenServiceDirectorDetailsSchema.dob.dobDay.validate,
  adyenServiceDirectorDetailsSchema.dob.dobMonth.validate,
  adyenServiceDirectorDetailsSchema.dob.dobYear.validate,
  adyenServiceDirectorDetailsSchema.dob.validate,
  adyenServiceDirectorDetailsSchema.email.validate,
]

export { adyenServiceDirectorDetailsSchema, ADYEN_SERVICE_DIRECTOR_DETAILS_VALIDATIONS }
