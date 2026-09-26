// theme.js: remembers and applies the light/dark choice.
//
// The actual colors live in styles.css. All this file does is put
// data-theme="light" or data-theme="dark" on the <html> tag, which tells the
// CSS which set of color variables to use.
//
// index.html also has a tiny copy of readSavedTheme() that runs BEFORE React
// loads. Without it, a dark-theme user would see a white flash on every visit
// while React starts up.

export const THEME_STORAGE_KEY = 'cambio.theme'

// Same localStorage try/catch pattern as the language choice: if storage is
// blocked, the toggle still works, it just isn't remembered.
export function readSavedTheme() {
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY)
    return saved === 'light' || saved === 'dark' ? saved : null
  } catch {
    return null
  }
}

// What the phone/computer is set to. matchMedia runs a CSS media query from
// JavaScript and tells us whether it matches.
export function systemTheme() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme // becomes <html data-theme="...">
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Ignore: remembering is a convenience.
  }
}
