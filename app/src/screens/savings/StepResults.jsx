// StepResults.jsx: Step 3 of 3, "Your savings".
// For now only the heading and Back link; the savings panel, the results
// list, and the rest come in the next step of the build.

import { useLanguage } from '../../i18n/languageContext.js'

export default function StepResults({ onBack }) {
  const { t } = useLanguage()

  return (
    <>
      <button type="button" className="link-button back-link" onClick={onBack}>
        {t('flow.back')}
      </button>
      <h1 tabIndex={-1}>{t('results.title')}</h1>
    </>
  )
}
