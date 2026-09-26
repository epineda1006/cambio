// ThemeToggle.jsx: one button that flips between light and dark.
//
// The button's visible label names the theme you'll SWITCH TO ("Dark" while
// in light mode), next to a moon or sun icon. The aria-label spells out the
// action for screen readers.

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

  function handleClick() {
    applyTheme(next)
    setTheme(next)
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={handleClick}
      aria-label={t(next === 'dark' ? 'theme.switchToDark' : 'theme.switchToLight')}
    >
      {next === 'dark' ? <MoonIcon /> : <SunIcon />}
      {/* Hidden on the narrowest phones (see .theme-toggle-label in styles.css). */}
      <span className="theme-toggle-label">{t(`theme.${next}`)}</span>
    </button>
  )
}
