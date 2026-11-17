import { body, ValidationChain } from 'express-validator'

const SORT_CODE_LENGTH = 6
const ACCOUNT_NUMBER_MIN_LENGTH = 6
const ACCOUNT_NUMBER_MAX_LENGTH = 8

const adyenBankDetailsSchema = {
  sortCode: {
    validate: body('sortCode')
      .trim()
      .customSanitizer((sortCode: string) => sortCode.replace(/[\s-]/g, ''))
      .notEmpty()
      .withMessage('Enter a sort code')
      .bail()
      .isNumeric({ no_symbols: true })
      .withMessage('Enter a valid sort code')
      .bail()
      .isLength({ min: SORT_CODE_LENGTH, max: SORT_CODE_LENGTH })
      .withMessage(`Sort code must be ${SORT_CODE_LENGTH} digits long`),
  },
  accountNumber: {
    validate: body('accountNumber')
      .notEmpty()
      .withMessage('Enter an account number')
      .bail()
      .isNumeric({ no_symbols: true })
      .withMessage('Enter a valid account number like 12345678')
      .bail()
      .isLength({ min: ACCOUNT_NUMBER_MIN_LENGTH, max: ACCOUNT_NUMBER_MAX_LENGTH })
      .withMessage(
        `Account number must be between ${ACCOUNT_NUMBER_MIN_LENGTH} and ${ACCOUNT_NUMBER_MAX_LENGTH} digits long`
      )
      .bail(),
  },
}

const ADYEN_BANK_DETAILS_VALIDATIONS: ValidationChain[] = [
  adyenBankDetailsSchema.sortCode.validate,
  adyenBankDetailsSchema.accountNumber.validate,
]

export { adyenBankDetailsSchema, ADYEN_BANK_DETAILS_VALIDATIONS }
