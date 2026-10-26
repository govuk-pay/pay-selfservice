import { body, Meta } from 'express-validator'

export interface ResponsiblePersonDetailsBody {
  firstName: string
  lastName: string
  dobDay: string
  dobMonth: string
  dobYear: string
}

function isDobEntered(_: unknown, meta: Meta): boolean {
  const { dobDay, dobMonth, dobYear } = meta.req.body as ResponsiblePersonDetailsBody
  return Boolean(dobDay) || Boolean(dobMonth) || Boolean(dobYear)
}

const adyenResponsiblePersonSchema = {
  details: {
    firstName: {
      validate: body('firstName')
        .notEmpty()
        .withMessage('Enter the first name')
        .bail()
        .isLength({ max: 100 })
        .withMessage('First name must be 100 characters or fewer'),
    },
    lastName: {
      validate: body('lastName')
        .notEmpty()
        .withMessage('Enter the last name')
        .bail()
        .isLength({ max: 100 })
        .withMessage('Last name must be 100 characters or fewer'),
    },
    dob: {
      // error should appear on dobDay field
      // ensures the error summary points at the first field in the dob component if the dob error is generic to all fields in said component
      validate: body('dobDay')
        .custom((_, meta) => isDobEntered(_, meta))
        .withMessage('Enter the date of birth'),
    },
    dobDay: {
      validate: body('dobDay')
        .if(isDobEntered)
        .trim()
        .notEmpty()
        .withMessage('Date of birth must include a day')
        .bail()
        .isInt({ min: 1, max: 31 })
        .withMessage('Day of birth must be a number between 1 and 31'),
    },
    dobMonth: {
      validate: body('dobMonth')
        .if(isDobEntered)
        .trim()
        .notEmpty()
        .withMessage('Date of birth must include a month')
        .bail()
        .isInt({ min: 1, max: 12 })
        .withMessage('Month of birth must be a number between 1 and 12'),
    },
    dobYear: {
      validate: body('dobYear')
        .if(isDobEntered)
        .trim()
        .notEmpty()
        .withMessage('Date of birth must include a year')
        .bail()
        .isInt({ min: 1900, max: new Date().getFullYear() })
        .withMessage('Enter a valid year of birth'),
    },
  },
}

export { adyenResponsiblePersonSchema }
