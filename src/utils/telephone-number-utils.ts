import { PhoneNumberUtil, PhoneNumberFormat } from 'google-libphonenumber'
const phoneNumberUtilInstance = PhoneNumberUtil.getInstance()

function invalidTelephoneNumber(telephoneNumber?: string) {
  if (!telephoneNumber) {
    return true
  }

  try {
    const parsedTelephoneNumber = phoneNumberUtilInstance.parseAndKeepRawInput(telephoneNumber, 'GB')
    return !phoneNumberUtilInstance.isValidNumber(parsedTelephoneNumber)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e: unknown) {
    return true
  }
}

function formatPhoneNumberWithCountryCode(telephoneNumber: string): string {
  const parsedNumber = phoneNumberUtilInstance.parseAndKeepRawInput(telephoneNumber, 'GB')
  return phoneNumberUtilInstance.format(parsedNumber, PhoneNumberFormat.INTERNATIONAL)
}

export { invalidTelephoneNumber, formatPhoneNumberWithCountryCode }
