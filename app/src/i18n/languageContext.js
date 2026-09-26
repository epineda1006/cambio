// languageContext.js: the bilingual (EN/ES) machinery.
//
// "i18n" is short for "internationalization" (i + 18 letters + n). The idea:
// components never contain visible text. They ask for a KEY, like
// t('app.tagline'), and we look up that key in en.json or es.json depending
// on the chosen language. Translating the app means editing JSON, not code.
//
// CONTEXT
// Almost every component needs the current language. Passing it by hand
// through every component ("prop drilling") gets messy, so React offers
// Context: a value set once near the top of the app (in LanguageProvider.jsx)
// that any component below can read with the useLanguage() hook.
//
// This file holds the pieces that are NOT components (the context object,
// the hook, and plain helper functions). The component lives in
// LanguageProvider.jsx. Keeping them apart lets Vite's instant reload work
// properly, since it needs component files to export only components.

import { createContext, useContext } from 'react'
import en from './en.json'
import es from './es.json'

export const DICTIONARIES = { en, es }
export const LANGUAGES = ['en', 'es']
export const DEFAULT_LANGUAGE = 'en'

// Intl.NumberFormat needs a "locale" (language + region). es-US is Spanish as
// used in the United States: dollars shown as "$1,244", like our customers
// see on receipts.
export const LOCALES = { en: 'en-US', es: 'es-US' }

// The key the language choice is saved under in the browser's localStorage.
export const STORAGE_KEY = 'cambio.language'

/**
 * Pick the language for a first visit:
 * 1. a choice saved earlier with the toggle, if any;
 * 2. otherwise Spanish if the phone/browser lists Spanish first among
 *    our supported languages;
 * 3. otherwise English.
 *
 * savedValue and browserLanguages are passed in (instead of read here) so
 * this stays a pure function we can test.
 */
export function detectInitialLanguage(savedValue, browserLanguages = []) {
  if (LANGUAGES.includes(savedValue)) return savedValue
  for (const tag of browserLanguages) {
    // Browser tags look like "es-MX" or "en-US"; we only need the first part.
    const base = String(tag).toLowerCase().split('-')[0]
    if (LANGUAGES.includes(base)) return base
  }
  return DEFAULT_LANGUAGE
}

// Follow a dotted key like "items.plastic_cups" into a nested object.
function lookup(dictionary, key) {
  return key.split('.').reduce((node, part) => (node == null ? undefined : node[part]), dictionary)
}

/**
 * Translate one key. Falls back to English if the Spanish text is missing,
 * and to the key itself if both are missing, so a gap is visible on screen
 * ("owner.title") instead of a blank space.
 *
 * vars fills {placeholders}: translate('es', 'x', { amount: '$5' }) turns
 * "Ahorra {amount}" into "Ahorra $5".
 */
export function translate(language, key, vars = {}) {
  let text = lookup(DICTIONARIES[language], key)
  if (typeof text !== 'string') text = lookup(DICTIONARIES[DEFAULT_LANGUAGE], key)
  if (typeof text !== 'string') {
    if (import.meta.env.DEV) console.warn(`Missing translation: ${key}`)
    return key
  }
  return text.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match))
}

/**
 * Plurals: "1 item has" vs "2 items have". The JSON stores both forms as
 * key_one and key_other, and Intl.PluralRules (built into the browser) tells
 * us which form a number needs in each language. (Some languages have more
 * than two forms; English and Spanish only need these two.)
 */
export function translatePlural(language, key, count, vars = {}) {
  const form = new Intl.PluralRules(LOCALES[language]).select(count) // 'one' or 'other'
  const fullKey = form === 'one' ? `${key}_one` : `${key}_other`
  return translate(language, fullKey, { count, ...vars })
}

/**
 * Number formatters for one language, built on Intl.NumberFormat (the
 * browser's built-in formatter). A plain function, not a hook, so code
 * outside components (like the "Share my plan" text) formats numbers exactly
 * the way the screen does.
 */
export function createFormatters(language) {
  const locale = LOCALES[language]
  // Money: whole dollars for big amounts ("$1,246"), cents for small ones
  // ("$11.25"), so a small loss never rounds to a misleading "$0".
  const money = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })
  const moneyCents = new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' })
  const whole = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 })
  const oneDecimal = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 })
  const percent = new Intl.NumberFormat(locale, { style: 'percent' })

  return {
    formatMoney: (n) => (Math.abs(n) < 100 ? moneyCents : money).format(n),
    formatNumber: (n) => whole.format(n),
    formatDecimal: (n) => oneDecimal.format(n),
    formatPercent: (fraction) => percent.format(fraction), // 0.5 -> "50%"
  }
}

// The Context object itself. Its value is filled in by LanguageProvider.
export const LanguageContext = createContext(null)

/**
 * The hook components use:
 *   const { t, tPlural, language, setLanguage, formatMoney, formatNumber } = useLanguage()
 *
 * A "hook" is a function starting with "use" that lets a component tap into
 * React features (here: reading the Context).
 */
export function useLanguage() {
  const value = useContext(LanguageContext)
  if (!value) throw new Error('useLanguage() must be used inside <LanguageProvider>')
  return value
}
