// pilot.js: the ONE place for the "Join the pilot" contact details.
//
// ⚠️  THIS REPO IS PUBLIC. Anything written here is visible to anyone on
// GitHub, forever (even after you delete it, it stays in git history).
//   - NEVER put a personal phone number here. Use a TEAM Google Voice number.
//   - Use a TEAM Google Form link, not a form tied to someone's personal
//     account details.
//
// While a value is still 'PLACEHOLDER', the Step 4 buttons say "Coming soon"
// and open nothing.

export const PILOT = {
  // Team Google Voice number, e.g. '+15595550123' (country code, no spaces).
  smsNumber: 'PLACEHOLDER',
  // Team Google Form link, e.g. 'https://forms.gle/...'.
  formUrl: 'PLACEHOLDER',
}

const isSet = (value) => typeof value === 'string' && value !== '' && value !== 'PLACEHOLDER'

/** True only when BOTH contact details have been filled in. */
export function isPilotReady(pilot = PILOT) {
  return isSet(pilot.smsNumber) && isSet(pilot.formUrl)
}

/**
 * Build a link that opens the phone's Messages app with our number and a
 * message already typed in.
 *
 * Format: sms:<number>?&body=<message>
 * iPhones and Android phones historically disagree on the separator before
 * "body" (iPhone wanted "&", Android "?"). Writing BOTH ("?&") is the form
 * both accept, so the prefilled text shows up on either phone.
 *
 * encodeURIComponent makes the message safe inside a link: spaces become
 * %20, "&" becomes %26 (otherwise it would end the message early), and
 * accented letters like "é" become their UTF-8 codes.
 */
export function buildSmsLink(number, message) {
  // Keep only a leading "+" and digits: "(559) 555-0123" -> "5595550123".
  const cleaned = String(number).trim().replace(/(?!^\+)[^\d]/g, '')
  return `sms:${cleaned}?&body=${encodeURIComponent(message)}`
}
