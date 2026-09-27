// @vitest-environment jsdom
//
// The "no savings" case of the results screen. With today's PLACEHOLDER
// prices every best swap saves at least a little, so the real data never
// shows it. This test feeds the screen a small FIXTURE: made-up CSV files
// (in src/test-fixtures/) where washing costs more than buying new
// disposables, so every swap loses money.

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import LanguageProvider from '../../i18n/LanguageProvider.jsx'
import { parseItemsCsv } from '../../lib/loadItems.js'
import { parseSwapsCsv } from '../../lib/loadSwaps.js'
import { buildResults } from '../../lib/results.js'
import losingItemsCsv from '../../test-fixtures/losing-items.csv?raw'
import losingSwapsCsv from '../../test-fixtures/losing-swaps.csv?raw'
import StepResults from './StepResults.jsx'

const losingData = {
  swapItems: parseSwapsCsv(losingSwapsCsv),
  itemProfiles: parseItemsCsv(losingItemsCsv),
}
const flow = { step: 3, customersPerDay: '120', daysOpen: 6, dineInPct: 50, overrides: {} }

afterEach(cleanup)

describe('results when every swap loses money', () => {
  it('really does lose money with the fixture (sanity check)', () => {
    const results = buildResults(flow, losingData)
    expect(results.totalAnnualSavings).toBe(0)
    expect(results.itemsWithoutSavingSwap).toBe(2)
    for (const item of results.items) expect(item.best.annualSavings).toBeLessThan(0)
  })

  it('shows the neutral panel, red notes, and no BEST tags', () => {
    window.localStorage.clear()
    const { container } = render(
      <LanguageProvider>
        <StepResults flow={flow} data={losingData} onBack={() => {}} onReset={() => {}} />
      </LanguageProvider>,
    )

    // Neutral panel instead of the green one.
    expect(container.querySelector('.result-panel-neutral')).toBeTruthy()
    expect(screen.getByText('None of these swaps save money at these prices.')).toBeTruthy()
    expect(screen.queryByText('You could save')).toBeNull()

    // A red note on every item, and each loss stated in red.
    const notes = screen.getAllByText('No swap saves money on this item yet.')
    expect(notes).toHaveLength(2)
    for (const note of notes) expect(note.className).toContain('note-negative')
    const losses = screen.getAllByText(/^Costs \$[\d,.]+ more a year$/)
    expect(losses).toHaveLength(2)
    for (const loss of losses) expect(loss.className).toContain('negative')

    // A money-losing swap is never called BEST.
    expect(screen.queryByText('BEST')).toBeNull()
  })
})
