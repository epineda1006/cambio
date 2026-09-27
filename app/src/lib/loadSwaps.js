// loadSwaps.js: reads app/src/data/swaps.csv and turns it into JavaScript
// objects the calculator can use.
//
// HOW THE CSV GETS HERE
// The "?raw" at the end of the import below is a Vite feature: it imports the
// file's contents as one plain text string instead of trying to run it as
// code. Vite bakes that text into the app at build time, so there is no
// separate download and it works offline.
//
// WHAT THE CSV LOOKS LIKE
// One row per SWAP. An item with two swaps (e.g. plastic_cups) appears on two
// rows, repeating the item's unit_cost. Column meanings:
//   item_id              the disposable the owner buys (names live in i18n files)
//   unit_cost            price of ONE disposable, in dollars
//   swap_id              the reusable alternative (names live in i18n files)
//   reusable_unit_price  price of ONE reusable item, in dollars
//   par_multiplier       stock kept on hand, in days of use (1.5 = a day and a half)
//   wash_cost_per_use    water, soap, and labor to wash one item once, in dollars
//   annual_loss_rate     fraction of reusables lost or broken per year (0.2 = 20%)
//   effort               how hard the switch is for staff: easy, medium, or hard
//                        (Step 4 recommends the easy swap that saves the most)
//   hand_wash_seconds    seconds to wash ONE of these by hand; turned into
//                        dollars with the hourly wage in assumptions.csv
//   notes                where the numbers came from; "PLACEHOLDER" = not real yet
//
// Everything that can go wrong with the file (typo in a number, a missing
// column) throws an error with the row number, so a bad edit is caught
// immediately instead of quietly producing wrong savings.

import swapsCsvText from '../data/swaps.csv?raw'
import { isPlaceholderNote, parseCsvRows, toNumber as toNumberIn } from './csv.js'

const FILE = 'swaps.csv'

const NUMBER_COLUMNS = [
  'unit_cost',
  'reusable_unit_price',
  'par_multiplier',
  'wash_cost_per_use',
  'annual_loss_rate',
  'hand_wash_seconds',
]

export const EFFORT_LEVELS = ['easy', 'medium', 'hard']

// Same as csv.js toNumber, with this file's name filled in for error messages.
const toNumber = (row, column, rowNumber) => toNumberIn(row, column, rowNumber, FILE)

/**
 * Turn CSV text into a list of items, each holding its swaps.
 * Kept separate from the ?raw import so tests can pass in their own CSV text.
 *
 * @returns {Array} [{ itemId, unitCost, swaps: [{ swapId, reusableUnitPrice,
 *   parMultiplier, washCostPerUse, annualLossRate, effort, handWashSeconds,
 *   notes, isPlaceholder }] }]
 */
export function parseSwapsCsv(csvText) {
  const rows = parseCsvRows(csvText, FILE)

  // A Map keeps items in the order they first appear in the CSV.
  const items = new Map()

  rows.forEach(({ row, rowNumber }) => {
    for (const column of NUMBER_COLUMNS) toNumber(row, column, rowNumber)

    const itemId = row.item_id?.trim()
    const swapId = row.swap_id?.trim()
    if (!itemId || !swapId) {
      throw new Error(`swaps.csv row ${rowNumber}: item_id and swap_id are required`)
    }

    const unitCost = toNumber(row, 'unit_cost', rowNumber)
    if (!items.has(itemId)) {
      items.set(itemId, { itemId, unitCost, swaps: [] })
    }
    const item = items.get(itemId)

    // The same item must have the same disposable price on every row;
    // otherwise we wouldn't know which one to use.
    if (item.unitCost !== unitCost) {
      throw new Error(`swaps.csv row ${rowNumber}: unit_cost for ${itemId} differs from an earlier row`)
    }

    // Only the three known effort levels are allowed, so a typo like "esay"
    // can't silently drop a swap out of Step 4's "easy" pick.
    const effort = row.effort?.trim()
    if (!EFFORT_LEVELS.includes(effort)) {
      throw new Error(`swaps.csv row ${rowNumber}: effort must be easy, medium, or hard (got "${row.effort}")`)
    }

    const notes = row.notes ?? ''
    item.swaps.push({
      swapId,
      reusableUnitPrice: toNumber(row, 'reusable_unit_price', rowNumber),
      parMultiplier: toNumber(row, 'par_multiplier', rowNumber),
      washCostPerUse: toNumber(row, 'wash_cost_per_use', rowNumber),
      annualLossRate: toNumber(row, 'annual_loss_rate', rowNumber),
      effort,
      handWashSeconds: toNumber(row, 'hand_wash_seconds', rowNumber),
      notes,
      // The UI uses this flag to show the "placeholder prices" badge.
      isPlaceholder: isPlaceholderNote(notes),
    })
  })

  return [...items.values()]
}

// The parsed data the app actually uses. It is computed once, when this file
// is first imported.
export const swapItems = parseSwapsCsv(swapsCsvText)
