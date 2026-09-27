// Tests for shareText.js. They build the text from a small hand-made results
// object, so the expected wording and numbers are known exactly.

import { describe, expect, it } from 'vitest'
import { buildShareText } from './shareText.js'

const savingResults = {
  totalAnnualSavings: 3167.4,
  totalMonthlySavings: 263.95,
  totalPounds: 932.7,
  items: [
    { itemId: 'plastic_cups', best: { swapId: 'glass_cup', annualSavings: 1021 }, bestSavesMoney: true },
    { itemId: 'plastic_forks', best: { swapId: 'metal_fork', annualSavings: -12.5 }, bestSavesMoney: false },
    { itemId: 'takeout_clamshells', best: null, bestSavesMoney: false }, // nothing to swap
  ],
}

describe('buildShareText', () => {
  it('writes the plan in English', () => {
    expect(buildShareText(savingResults, 'en', true)).toBe(
      [
        'My Cambio plan',
        'I could save $3,167 a year ($264 a month) by switching dine-in orders to reusables.',
        "That's 933 pounds of plastic avoided a year.",
        '- Plastic cups: Glass cup (saves $1,021 a year)',
        '- Plastic forks: no swap saves money yet',
        'Prices are examples, not real quotes.',
      ].join('\n'),
    )
  })

  it('writes the plan in Spanish', () => {
    const text = buildShareText(savingResults, 'es', true)
    expect(text.split('\n')[0]).toBe('Mi plan de Cambio')
    expect(text).toContain('Podría ahorrar $3,167 al año ($264 al mes)')
    expect(text).toContain('- Vasos de plástico: Vaso de vidrio (ahorra $1,021 al año)')
    expect(text).toContain('Los precios son ejemplos, no cotizaciones reales.')
  })

  it('always includes the placeholder warning while numbers are examples', () => {
    expect(buildShareText(savingResults, 'en', true)).toContain('Prices are examples')
    expect(buildShareText(savingResults, 'en', false)).not.toContain('Prices are examples')
  })

  it('says so honestly when nothing saves money', () => {
    const none = { ...savingResults, totalAnnualSavings: 0, totalMonthlySavings: 0, totalPounds: 0 }
    const text = buildShareText(none, 'en', true)
    expect(text).toContain('None of these swaps save money at these prices.')
    expect(text).not.toContain('I could save')
  })
})
