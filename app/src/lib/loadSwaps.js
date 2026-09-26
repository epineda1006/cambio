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
//   notes                where the numbers came from; "PLACEHOLDER" = not real yet
//
// Everything that can go wrong with the file (typo in a number, a missing
// column) throws an error with the row number, so a bad edit is caught
// immediately instead of quietly producing wrong savings.

import Papa from 'papaparse'
import swapsCsvText from '../data/swaps.csv?raw'

const NUMBER_COLUMNS = [
  'unit_cost',
  'reusable_unit_price',
  'par_multiplier',
  'wash_cost_per_use',
  'annual_loss_rate',
]

// CSV files only hold text, so "0.10" arrives as a string. This converts it to
// a real number and complains loudly if it isn't one.
function toNumber(row, column, rowNumber) {
  const value = Number(row[column])
  if (row[column] === undefined || row[column].trim() === '' || !Number.isFinite(value)) {
    throw new Error(`swaps.csv row ${rowNumber}: "${column}" is not a number (got "${row[column]}")`)
  }
  return value
}

/**
 * Turn CSV text into a list of items, each holding its swaps.
 * Kept separate from the ?raw import so tests can pass in their own CSV text.
 *
 * @returns {Array} [{ itemId, unitCost, swaps: [{ swapId, reusableUnitPrice,
 *   parMultiplier, washCostPerUse, annualLossRate, notes, isPlaceholder }] }]
 */
export function parseSwapsCsv(csvText) {
  // header: true means "use the first row as column names", so each row
  // becomes an object like { item_id: 'plastic_cups', unit_cost: '0.10', ... }.
  const { data, errors } = Papa.parse(csvText, { header: true, skipEmptyLines: true })
  if (errors.length > 0) {
    throw new Error(`swaps.csv could not be read: ${errors[0].message} (row ${errors[0].row + 2})`)
  }

  // A Map keeps items in the order they first appear in the CSV.
  const items = new Map()

  data.forEach((row, index) => {
    const rowNumber = index + 2 // +1 for the header row, +1 because people count from 1
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

    const notes = row.notes ?? ''
    item.swaps.push({
      swapId,
      reusableUnitPrice: toNumber(row, 'reusable_unit_price', rowNumber),
      parMultiplier: toNumber(row, 'par_multiplier', rowNumber),
      washCostPerUse: toNumber(row, 'wash_cost_per_use', rowNumber),
      annualLossRate: toNumber(row, 'annual_loss_rate', rowNumber),
      notes,
      // The UI uses this flag to show the "placeholder prices" badge.
      isPlaceholder: notes.includes('PLACEHOLDER'),
    })
  })

  return [...items.values()]
}

// The parsed data the app actually uses. It is computed once, when this file
// is first imported.
export const swapItems = parseSwapsCsv(swapsCsvText)
