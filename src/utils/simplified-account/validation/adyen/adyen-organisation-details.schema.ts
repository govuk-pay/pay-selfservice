import { body, ValidationChain } from 'express-validator'
import { postcodeRegex } from '@utils/validation/postcode-validation'

const ORGANISATION_NAME_MIN_LENGTH = 3
const ORGANISATION_NAME_MAX_LENGTH = 100
const ADDRESS_FIELD_MIN_LENGTH = 3
const ADDRESS_FIELD_MAX_LENGTH = 255

const NUMBERS_ONLY_REGEX = /^[\d\s]+$/

interface PostcodeValidationRequest {
  body: {
    addressCountry?: string
  }
}

const adyenOrganisationDetailsSchema = {
  organisationName: {
    validate: body('organisationName')
      .trim()
      .notEmpty()
      .withMessage('Enter an organisation name')
      .bail()
      .isLength({ min: ORGANISATION_NAME_MIN_LENGTH })
      .withMessage(`Organisation name must be ${ORGANISATION_NAME_MIN_LENGTH} characters or more`)
      .bail()
      .isLength({ max: ORGANISATION_NAME_MAX_LENGTH })
      .withMessage(`Organisation name must be ${ORGANISATION_NAME_MAX_LENGTH} characters or fewer`)
      .bail()
      .not()
      .matches(NUMBERS_ONLY_REGEX)
      .withMessage('Organisation name cannot contain only numbers')
      .bail()
      .unescape()
      .matches(/^[^<>|]*$/) // no '<' or '>' or '|' characters
      .withMessage('You cannot use any of the following characters < > | in the organisation name'),
  },
  organisationAddress: {
    line1: {
      validate: body('addressLine1')
        .trim()
        .notEmpty()
        .withMessage('Enter address line 1')
        .bail()
        .isLength({ min: ADDRESS_FIELD_MIN_LENGTH })
        .withMessage(`Address line 1 must be ${ADDRESS_FIELD_MIN_LENGTH} characters or more`)
        .bail()
        .isLength({ max: ADDRESS_FIELD_MAX_LENGTH })
        .withMessage(`Address line 1 must be ${ADDRESS_FIELD_MAX_LENGTH} characters or fewer`)
        .bail()
        .not()
        .matches(NUMBERS_ONLY_REGEX)
        .withMessage('Address line 1 must include the building and street')
        .bail()
        .bail()
        .unescape()
        .matches(/^[^<>|]*$/) // no '<' or '>' or '|' characters
        .withMessage('You cannot use any of the following characters < > | in address line 1'),
    },
    line2: {
      validate: body('addressLine2')
        .trim()
        .optional({ values: 'falsy' })
        .isLength({ max: ADDRESS_FIELD_MAX_LENGTH })
        .withMessage(`Address line 2 must be ${ADDRESS_FIELD_MAX_LENGTH} characters or fewer`)
        .bail()
        .unescape()
        .matches(/^[^<>|]*$/) // no '<' or '>' or '|' characters
        .withMessage('You cannot use any of the following characters < > | in address line 2'),
    },
    city: {
      validate: body('addressCity')
        .trim()
        .notEmpty()
        .withMessage('Enter a town or city')
        .bail()
        .isLength({ min: ADDRESS_FIELD_MIN_LENGTH })
        .withMessage(`Town or city must be ${ADDRESS_FIELD_MIN_LENGTH} characters or more`)
        .bail()
        .isLength({ max: ADDRESS_FIELD_MAX_LENGTH })
        .withMessage(`Town or city must be ${ADDRESS_FIELD_MAX_LENGTH} characters or fewer`)
        .bail()
        .not()
        .matches(NUMBERS_ONLY_REGEX)
        .withMessage('Town or city cannot contain only numbers')
        .bail()
        .unescape()
        .matches(/^[^<>|]*$/) // no '<' or '>' or '|' characters
        .withMessage('You cannot use any of the following characters < > | in the town or city'),
    },
    postcode: {
      validate: body('addressPostcode')
        .trim()
        .customSanitizer((postcode: string) => postcode.toUpperCase())
        .notEmpty()
        .withMessage('Enter a postcode')
        .bail()
        .custom((postcode: string, { req }: { req: unknown }) => {
          const _req = req as PostcodeValidationRequest
          return _req.body?.addressCountry && _req.body.addressCountry === 'GB' // only validate GB postcodes
            ? postcodeRegex.test(postcode)
            : true
        })
        .withMessage('Enter a real postcode'),
    },
    country: {
      validate: body('addressCountry')
        .trim()
        .notEmpty()
        .withMessage('Select a country')
        .bail()
        .isLength({ min: 2, max: 2 })
        .withMessage('Select a country'),
    },
  },
  email: {
    validate: body('email')
      .trim()
      .notEmpty()
      .withMessage('Enter an email address')
      .bail()
      .isEmail()
      .withMessage('Enter an email address in the correct format'),
  },
  hasCompanyRegistrationNumber: {
    validate: body('hasCompanyRegistrationNumber')
      .isIn(['true', 'false'])
      .withMessage('Select yes if your organisation has a company registration number'),
  },
}

const ADYEN_ORGANISATION_DETAILS_VALIDATIONS: ValidationChain[] = [
  adyenOrganisationDetailsSchema.organisationName.validate,
  adyenOrganisationDetailsSchema.organisationAddress.line1.validate,
  adyenOrganisationDetailsSchema.organisationAddress.line2.validate,
  adyenOrganisationDetailsSchema.organisationAddress.city.validate,
  adyenOrganisationDetailsSchema.organisationAddress.country.validate,
  adyenOrganisationDetailsSchema.organisationAddress.postcode.validate,
  adyenOrganisationDetailsSchema.email.validate,
  adyenOrganisationDetailsSchema.hasCompanyRegistrationNumber.validate,
]

export { adyenOrganisationDetailsSchema, ADYEN_ORGANISATION_DETAILS_VALIDATIONS }
