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

import { estimateWeeklyQty } from './calculator.js'
import { itemProfiles } from './loadItems.js'

export const DAYS_CHOICES = [5, 6, 7]

// "For here or to go?" answers, and the dine-in share each one stands for.
export const DINE_IN_CHOICES = [
  { pct: 20, key: 'mostlyToGo' },
  { pct: 50, key: 'halfAndHalf' },
  { pct: 80, key: 'mostlyHere' },
]

export const MAX_CUSTOMERS = 5000
export const MAX_WEEKLY = 100000

// Object.freeze stops anyone from accidentally changing the starting state.
export const INITIAL_FLOW = Object.freeze({
  step: 1,
  customersPerDay: '',
  daysOpen: null,
  dineInPct: null,
  overrides: Object.freeze({}),
})

/**
 * Read a whole number (customers a day, or a weekly count) from what was
 * typed. People type numbers in many ways ("120", " 120 ", "1,200"), so
 * spaces and commas are removed first.
 * Returns a whole number, or null if the text isn't one.
 */
export function parseWholeNumber(text) {
  const cleaned = String(text).replace(/[\s,]/g, '')
  // /^\d+$/ is a regular expression: "only digits, from start to end".
  if (!/^\d+$/.test(cleaned)) return null
  return Number(cleaned)
}

export const parseCustomers = parseWholeNumber

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

/**
 * Check a weekly number the owner typed over an estimate (Step 2).
 * Returns null if fine, or { key, vars } describing the problem.
 * 0 is allowed: some businesses don't use forks at all.
 */
export function validateWeekly(text) {
  const n = parseWholeNumber(text)
  if (n === null) return { key: 'errors.weeklyInvalid' }
  if (n > MAX_WEEKLY) return { key: 'errors.weeklyTooHigh', vars: { max: MAX_WEEKLY } }
  return null
}

/**
 * What the business uses per week, item by item: our estimate from Step 1,
 * replaced by the owner's own number wherever they typed one.
 *
 * @param profiles  item ratios; defaults to items.csv (tests can pass their own)
 * @returns [{ itemId, estimate, weeklyQty, isOverride }] in items.csv order
 */
export function weeklyUsage({ customersPerDay, daysOpen, overrides }, profiles = itemProfiles) {
  const customers = parseCustomers(customersPerDay) ?? 0
  const days = DAYS_CHOICES.includes(daysOpen) ? daysOpen : DAYS_CHOICES[DAYS_CHOICES.length - 1]

  return profiles.map(({ itemId, perCustomer }) => {
    const estimate = estimateWeeklyQty({ customersPerDay: customers, daysOpen: days, perCustomer })
    // An override only counts if it's a valid number; otherwise use the estimate.
    const typed = overrides?.[itemId]
    const override = typed !== undefined && validateWeekly(typed) === null ? parseWholeNumber(typed) : null
    return {
      itemId,
      estimate,
      weeklyQty: override ?? estimate,
      isOverride: override !== null,
    }
  })
}
