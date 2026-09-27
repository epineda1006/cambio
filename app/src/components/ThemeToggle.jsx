// ThemeToggle.jsx: one button that flips between light and dark.
//
// ICON ONLY, on purpose: a moon (switch to dark) or a sun (switch to
// light). An earlier version also showed a word, but it named the theme
// you'd switch TO ("Dark" while the page was light), which people read as
// the CURRENT theme. The aria-label spells out the action for screen
// readers ("Switch to dark theme"), and the title attribute shows the same
// words as a tooltip when you hover with a mouse.

import { useState } from 'react'
import { useLanguage } from '../i18n/languageContext.js'
import { applyTheme, readSavedTheme, systemTheme } from '../lib/theme.js'

// Icons are drawn with inline SVG (shapes described in code) so they need no
// image files and automatically use the current text color (currentColor).
// aria-hidden hides them from screen readers, since the text already says it.
function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  )
}

export default function ThemeToggle() {
  const { t } = useLanguage()
  // Start from the saved choice, or from what the phone is set to.
  const [theme, setTheme] = useState(() => readSavedTheme() ?? systemTheme())
  const next = theme === 'dark' ? 'light' : 'dark'
  const label = t(next === 'dark' ? 'theme.switchToDark' : 'theme.switchToLight')

  function handleClick() {
    applyTheme(next)
    setTheme(next)
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={handleClick}
      aria-label={label}
      title={label}
    >
      {next === 'dark' ? <MoonIcon /> : <SunIcon />}
    </button>
  )
}
