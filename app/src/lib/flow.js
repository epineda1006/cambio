// flow.js: the data and rules behind the 3-step Savings flow, kept apart
// from the screens so they can be tested without a browser.
//
// The flow's state (held in App.jsx) looks like:
//   {
//     step: 1 | 2 | 3,
//     customersPerDay: '120',   text exactly as typed
//     daysOpen: 6,              5, 6, 7, or null = not answered yet
//     dineInPct: 50,            20, 50, 80, or null = not answered yet
//     overrides: { plastic_cups: '400' }   weekly numbers the owner typed
//   }                                      over our estimate (step 2)

export const DAYS_CHOICES = [5, 6, 7]

// "For here or to go?" answers, and the dine-in share each one stands for.
export const DINE_IN_CHOICES = [
  { pct: 20, key: 'mostlyToGo' },
  { pct: 50, key: 'halfAndHalf' },
  { pct: 80, key: 'mostlyHere' },
]

export const MAX_CUSTOMERS = 5000

// Object.freeze stops anyone from accidentally changing the starting state.
export const INITIAL_FLOW = Object.freeze({
  step: 1,
  customersPerDay: '',
  daysOpen: null,
  dineInPct: null,
  overrides: Object.freeze({}),
})

/**
 * Read "customers a day" from what was typed. People type numbers in many
 * ways ("120", " 120 ", "1,200"), so spaces and commas are removed first.
 * Returns a whole number, or null if the text isn't one.
 */
export function parseCustomers(text) {
  const cleaned = String(text).replace(/[\s,]/g, '')
  // /^\d+$/ is a regular expression: "only digits, from start to end".
  if (!/^\d+$/.test(cleaned)) return null
  return Number(cleaned)
}

/**
 * Check the Step 1 answers. Returns a list of problems, in the same order as
 * the questions on screen (the error summary shows them in this order):
 *   [{ field: 'customers', key: 'errors.customersRequired', vars: {...} }, ...]
 * An empty list means everything is fine.
 *
 * `field` is the id of the input to jump to; `key` is the i18n text.
 */
export function validateBusiness({ customersPerDay, daysOpen, dineInPct }) {
  const errors = []

  if (String(customersPerDay).trim() === '') {
    errors.push({ field: 'customers', key: 'errors.customersRequired' })
  } else {
    const n = parseCustomers(customersPerDay)
    if (n === null) errors.push({ field: 'customers', key: 'errors.customersInvalid' })
    else if (n < 1) errors.push({ field: 'customers', key: 'errors.customersTooLow' })
    else if (n > MAX_CUSTOMERS) {
      errors.push({ field: 'customers', key: 'errors.customersTooHigh', vars: { max: MAX_CUSTOMERS } })
    }
  }

  if (!DAYS_CHOICES.includes(daysOpen)) {
    errors.push({ field: `days-${DAYS_CHOICES[0]}`, key: 'errors.daysRequired' })
  }

  if (!DINE_IN_CHOICES.some((c) => c.pct === dineInPct)) {
    errors.push({ field: `dinein-${DINE_IN_CHOICES[0].pct}`, key: 'errors.dineInRequired' })
  }

  return errors
}
