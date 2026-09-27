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

// ---------------------------------------------------------------------------
// KEYS USED IN THE CODE vs KEYS IN THE FILES
//
// import.meta.glob is a Vite feature: it imports every file matching a
// pattern. With query '?raw' each file arrives as plain text, so this test can
// READ our source code and find the translation keys it uses.
// ---------------------------------------------------------------------------

const sources = Object.entries(
  import.meta.glob('../**/*.{js,jsx}', { query: '?raw', import: 'default', eager: true }),
)
  .filter(([path]) => !/\.test\.jsx?$/.test(path)) // tests mention keys only to check them
  .map(([, text]) => text)
const code = sources.join('\n')

const GROUPS = Object.keys(en) // top-level names: app, nav, flow, results, ...
const allKeys = new Set(flatKeys(en))

// Every quoted string that looks like a key, e.g. 'results.title' or
// "map.placeholderData", and whose first part is one of our groups.
const usedKeys = new Set(
  [...code.matchAll(/['"]([a-z][A-Za-z]*(?:\.[A-Za-z0-9_]+)+)['"]/g)]
    .map((m) => m[1])
    .filter((key) => GROUPS.includes(key.split('.')[0]))
    .filter((key) => !/\.(csv|json|geojson|jsx?|css)$/.test(key)), // file names, e.g. 'items.csv'
)

// Keys built at run time, like `items.${item.itemId}`: we can't know the
// exact key, so every key under that prefix counts as used.
const dynamicPrefixes = [...code.matchAll(/`([a-z][A-Za-z.]*)\.\$\{/g)].map((m) => `${m[1]}.`)

// A key used with tPlural() is stored as key_one + key_other.
const exists = (dict, key) =>
  translate(dict, key) !== key ||
  (translate(dict, `${key}_one`) !== `${key}_one` && translate(dict, `${key}_other`) !== `${key}_other`)

describe('keys used in the code', () => {
  it('finds the keys (sanity check that the scan works)', () => {
    expect(usedKeys.has('results.title')).toBe(true)
    expect(dynamicPrefixes).toContain('items.')
  })

  it('exist in both en.json and es.json', () => {
    for (const lang of ['en', 'es']) {
      const missing = [...usedKeys].filter((key) => !exists(lang, key))
      expect(missing, `missing in ${lang}.json`).toEqual([])
    }
  })

  it('cover every key in the files (no leftover, unused text)', () => {
    const isUsed = (key) =>
      usedKeys.has(key) ||
      usedKeys.has(key.replace(/_(one|other)$/, '')) ||
      dynamicPrefixes.some((prefix) => key.startsWith(prefix))
    const unused = [...allKeys].filter((key) => !isUsed(key))
    expect(unused, 'unused keys in en.json').toEqual([])
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
    expect(translatePlural('en', 'results.compare', 1)).toBe('Compare 1 other option')
    expect(translatePlural('en', 'results.compare', 2)).toBe('Compare 2 other options')
    expect(translatePlural('es', 'results.compare', 1)).toBe('Comparar 1 opción más')
    expect(translatePlural('es', 'results.compare', 2)).toBe('Comparar 2 opciones más')
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
