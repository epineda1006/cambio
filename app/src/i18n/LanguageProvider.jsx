// LanguageProvider.jsx: holds the current language and shares it with the
// whole app through Context (see languageContext.js for the idea).
//
// Wrap the app once:  <LanguageProvider><App /></LanguageProvider>
// Then any component can call useLanguage().

import { useEffect, useMemo, useState } from 'react'
import {
  LOCALES,
  LanguageContext,
  STORAGE_KEY,
  detectInitialLanguage,
  translate,
  translatePlural,
} from './languageContext.js'

// localStorage is a small key-value store in the browser that survives page
// reloads. It can throw in private browsing or when storage is blocked, so
// every access is wrapped in try/catch: if it fails, the app still works and
// simply won't remember the choice.
function readSavedLanguage() {
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function saveLanguage(language) {
  try {
    window.localStorage.setItem(STORAGE_KEY, language)
  } catch {
    // Ignore: remembering the choice is a convenience, not a requirement.
  }
}

export default function LanguageProvider({ children }) {
  // useState holds a value that, when changed, makes React redraw the screen.
  // Passing a function means it only runs once, on first load.
  const [language, setLanguageState] = useState(() =>
    detectInitialLanguage(readSavedLanguage(), navigator.languages ?? [navigator.language]),
  )

  // useEffect runs code AFTER React draws the screen. Here: tell the browser
  // the page language (screen readers use it to pronounce text correctly).
  useEffect(() => {
    document.documentElement.lang = language
  }, [language]) // the [language] list means "re-run only when language changes"

  // useMemo rebuilds this object only when the language changes, instead of
  // on every redraw, so components that read it don't redraw needlessly.
  const value = useMemo(() => {
    const locale = LOCALES[language]
    // Intl.NumberFormat formats numbers the way each language expects.
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
      language,
      setLanguage(next) {
        setLanguageState(next)
        saveLanguage(next) // only an explicit toggle is remembered
      },
      t: (key, vars) => translate(language, key, vars),
      // tPlural('summary.noSavingSwap', 2) picks the _one or _other text.
      // Pass an already-formatted count in vars to override {count}.
      tPlural: (key, count, vars) => translatePlural(language, key, count, vars),
      formatMoney: (n) => (Math.abs(n) < 100 ? moneyCents : money).format(n),
      formatNumber: (n) => whole.format(n),
      formatDecimal: (n) => oneDecimal.format(n),
      formatPercent: (fraction) => percent.format(fraction), // 0.5 -> "50%"
    }
  }, [language])

  // Every component inside {children} can now read `value` via useLanguage().
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
