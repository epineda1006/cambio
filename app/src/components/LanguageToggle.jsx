// LanguageToggle.jsx: the EN | ES switch.
//
// Two buttons in a group. aria-pressed tells screen readers which one is
// active; the visual styling comes in the theme step.

import { LANGUAGES, useLanguage } from '../i18n/languageContext.js'

export default function LanguageToggle() {
  const { t, language, setLanguage } = useLanguage()

  return (
    <div className="language-toggle" role="group" aria-label={t('language.label')}>
      {/* .map() turns the list ['en', 'es'] into one button per language.
          React needs a unique "key" on each item in a list to track them. */}
      {LANGUAGES.map((code) => (
        <button
          key={code}
          type="button"
          aria-pressed={language === code}
          onClick={() => setLanguage(code)}
        >
          {t(`language.${code}`)}
        </button>
      ))}
    </div>
  )
}
