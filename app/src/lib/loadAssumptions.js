// loadAssumptions.js: reads app/src/data/assumptions.csv, a short list of
// single numbers the Step 4 math needs that don't belong to any one item or
// swap. The file is "key,value,notes": one row per number, so adding a new
// number later means adding a row, not a column.
//
//   hand_wash_hourly_wage  dollars per hour of dishwashing labor
//   extras_request_share   share of takeout customers who want forks/sauce
//                          when asked (0.3 = 30%)
//   sauce_per_order        sauce cups or packets in each takeout order
//   sauce_unit_cost        dollars per sauce cup or packet
//
// Like the other loaders, a missing row or a typo stops the app with a clear
// message instead of quietly producing wrong numbers.

import assumptionsCsvText from '../data/assumptions.csv?raw'
import { isPlaceholderNote, parseCsvRows, toNumber } from './csv.js'

const FILE = 'assumptions.csv'

// The rows the app needs, and the name each one gets in JavaScript.
export const REQUIRED_KEYS = {
  hand_wash_hourly_wage: 'handWashHourlyWage',
  extras_request_share: 'extrasRequestShare',
  sauce_per_order: 'saucePerOrder',
  sauce_unit_cost: 'sauceUnitCost',
}

/**
 * @returns { handWashHourlyWage, extrasRequestShare, saucePerOrder,
 *            sauceUnitCost, isPlaceholder }
 */
export function parseAssumptionsCsv(csvText) {
  const values = {}
  let isPlaceholder = false

  for (const { row, rowNumber } of parseCsvRows(csvText, FILE)) {
    const key = row.key?.trim()
    const name = REQUIRED_KEYS[key]
    if (!name) throw new Error(`${FILE} row ${rowNumber}: unknown key "${key}"`)
    if (name in values) throw new Error(`${FILE} row ${rowNumber}: ${key} appears twice`)
    const value = toNumber(row, 'value', rowNumber, FILE)
    if (value < 0) throw new Error(`${FILE} row ${rowNumber}: ${key} can't be negative`)
    values[name] = value
    if (isPlaceholderNote(row.notes)) isPlaceholder = true
  }

  for (const [key, name] of Object.entries(REQUIRED_KEYS)) {
    if (!(name in values)) throw new Error(`${FILE}: missing the "${key}" row`)
  }
  if (values.extrasRequestShare > 1) {
    throw new Error(`${FILE}: extras_request_share must be between 0 and 1`)
  }

  return { ...values, isPlaceholder }
}

export const assumptions = parseAssumptionsCsv(assumptionsCsvText)
