import type { ErrorFormatter, ValidationError } from 'express-validator'

export const transformDateOfBirthErrors: ErrorFormatter<ValidationError> = (error) => {
  return error.type === 'field' && error.path === 'dob' ? { ...error, pathOverride: 'dobDay' } : error
}
