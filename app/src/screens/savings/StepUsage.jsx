// StepUsage.jsx: Step 2 of 3, "What you use each week".
// For now only the heading and Back link; the estimates list, the Change
// links and the Continue button come in the next step of the build.

import { useLanguage } from '../../i18n/languageContext.js'

export default function StepUsage({ onBack }) {
  const { t } = useLanguage()

  return (
    <>
      <button type="button" className="link-button back-link" onClick={onBack}>
        {t('flow.back')}
      </button>
      <h1 tabIndex={-1}>{t('usage.title')}</h1>
    </>
  )
}
