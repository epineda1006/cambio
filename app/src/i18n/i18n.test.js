// Tests for the bilingual setup. The most important one: en.json and es.json
// must have exactly the same keys, so no screen is ever half-translated.

import { describe, it, expect } from 'vitest'
import en from './en.json'
import es from './es.json'
import { detectInitialLanguage, translate, translatePlural } from './languageContext.js'
import { swapItems } from '../lib/loadSwaps.js'

// Turn { a: { b: 'x' } } into ['a.b'] so two files can be compared.
function flatKeys(obj, prefix = '') {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'object' && v !== null ? flatKeys(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  )
}

describe('translation files', () => {
  it('en.json and es.json have the same keys', () => {
    expect(flatKeys(es).sort()).toEqual(flatKeys(en).sort())
  })

  it('every item and swap in swaps.csv has a name in both languages', () => {
    for (const lang of ['en', 'es']) {
      for (const item of swapItems) {
        expect(translate(lang, `items.${item.itemId}`)).not.toBe(`items.${item.itemId}`)
        for (const swap of item.swaps) {
          expect(translate(lang, `swaps.${swap.swapId}`)).not.toBe(`swaps.${swap.swapId}`)
        }
      }
    }
  })
})

describe('translate', () => {
  it('looks up nested keys per language', () => {
    expect(translate('en', 'items.plastic_cups')).toBe('Plastic cups')
    expect(translate('es', 'items.plastic_cups')).toBe('Vasos de plástico')
  })

  it('shows the key itself when a translation is missing', () => {
    expect(translate('es', 'does.not.exist')).toBe('does.not.exist')
  })
})

describe('translatePlural', () => {
  it('picks singular or plural in each language', () => {
    expect(translatePlural('en', 'summary.noSavingSwap', 1)).toMatch(/^1 item has/)
    expect(translatePlural('en', 'summary.noSavingSwap', 2)).toMatch(/^2 items have/)
    expect(translatePlural('es', 'summary.noSavingSwap', 1)).toMatch(/^1 artículo no tiene/)
    expect(translatePlural('es', 'summary.noSavingSwap', 2)).toMatch(/^2 artículos no tienen/)
  })
})

describe('detectInitialLanguage', () => {
  it('uses a saved choice first', () => {
    expect(detectInitialLanguage('es', ['en-US'])).toBe('es')
  })

  it('follows the phone language when nothing is saved', () => {
    expect(detectInitialLanguage(null, ['es-MX', 'en-US'])).toBe('es')
    expect(detectInitialLanguage(null, ['en-US', 'es-MX'])).toBe('en')
  })

  it('falls back to English for other languages', () => {
    expect(detectInitialLanguage(null, ['fr-FR'])).toBe('en')
    expect(detectInitialLanguage('xx', [])).toBe('en')
  })
})
