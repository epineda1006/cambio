// csv.js: shared helpers for reading our CSV data files (swaps.csv and
// items.csv). Both loaders use them, so a mistake in either file gives the
// same kind of clear message: the file name, the row number, and the column.

import Papa from 'papaparse'

/**
 * Parse CSV text into row objects, using the first line as column names.
 * Each result is { row, rowNumber }, where rowNumber is the line number a
 * person would see in a spreadsheet (header = 1, first data row = 2).
 */
export function parseCsvRows(csvText, fileName) {
  // header: true means "use the first row as column names", so each row
  // becomes an object like { item_id: 'plastic_cups', unit_cost: '0.10', ... }.
  const { data, errors } = Papa.parse(csvText, { header: true, skipEmptyLines: true })
  if (errors.length > 0) {
    throw new Error(`${fileName} could not be read: ${errors[0].message} (row ${errors[0].row + 2})`)
  }
  // +1 for the header row, +1 because people count from 1
  return data.map((row, index) => ({ row, rowNumber: index + 2 }))
}

/**
 * CSV files only hold text, so "0.10" arrives as a string. This converts it
 * to a real number and complains loudly if it isn't one.
 */
export function toNumber(row, column, rowNumber, fileName) {
  const value = Number(row[column])
  if (row[column] === undefined || row[column].trim() === '' || !Number.isFinite(value)) {
    throw new Error(`${fileName} row ${rowNumber}: "${column}" is not a number (got "${row[column]}")`)
  }
  return value
}

/** The flag the UI uses to label numbers that aren't real yet. */
export function isPlaceholderNote(notes) {
  return (notes ?? '').includes('PLACEHOLDER')
}
