// loadItems.js: reads app/src/data/items.csv, the per-item facts used to
// ESTIMATE weekly use from customers per day, and to turn "items avoided"
// into pounds of plastic.
//
// One row per ITEM (swaps.csv has one row per swap). Column meanings:
//   item_id       must match an item_id in swaps.csv
//   per_customer  how many of this item one customer uses, on average
//                 (0.8 cups per customer = 8 cups for every 10 customers)
//   grams_each    weight of ONE disposable, in grams
//   notes         where the numbers came from; "PLACEHOLDER" = not real yet
//
// Like loadSwaps.js, a typo in the file stops the app with a clear message
// (file, row, column) instead of quietly producing wrong estimates.

import itemsCsvText from '../data/items.csv?raw'
import { isPlaceholderNote, parseCsvRows, toNumber } from './csv.js'

const FILE = 'items.csv'

/**
 * Turn items.csv text into [{ itemId, perCustomer, gramsEach, notes,
 * isPlaceholder }]. Kept separate from the ?raw import so tests can pass in
 * their own CSV text.
 */
export function parseItemsCsv(csvText) {
  const seen = new Set()

  return parseCsvRows(csvText, FILE).map(({ row, rowNumber }) => {
    const itemId = row.item_id?.trim()
    if (!itemId) throw new Error(`${FILE} row ${rowNumber}: item_id is required`)
    // A Set holds each value once, which makes it easy to spot duplicates.
    if (seen.has(itemId)) throw new Error(`${FILE} row ${rowNumber}: ${itemId} appears twice`)
    seen.add(itemId)

    const perCustomer = toNumber(row, 'per_customer', rowNumber, FILE)
    const gramsEach = toNumber(row, 'grams_each', rowNumber, FILE)
    if (perCustomer < 0 || gramsEach < 0) {
      throw new Error(`${FILE} row ${rowNumber}: per_customer and grams_each can't be negative`)
    }

    const notes = row.notes ?? ''
    return { itemId, perCustomer, gramsEach, notes, isPlaceholder: isPlaceholderNote(notes) }
  })
}

export const itemProfiles = parseItemsCsv(itemsCsvText)

// The same data keyed by id, for quick lookup: itemProfilesById.plastic_cups
export const itemProfilesById = Object.fromEntries(itemProfiles.map((p) => [p.itemId, p]))
