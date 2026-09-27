// StepFirstSwitch.jsx: Step 4 of 4, "Your first switch".
// For now only the heading and Back link; the takeout questions, the
// recommended switch, the checklist, the takeout notes, and Join the pilot
// come in the next steps of the build.

import { useLanguage } from '../../i18n/languageContext.js'

export default function StepFirstSwitch({ onBack }) {
  const { t } = useLanguage()

  return (
    <>
      <button type="button" className="link-button back-link" onClick={onBack}>
        {t('flow.back')}
      </button>
      <h1 tabIndex={-1}>{t('firstSwitch.title')}</h1>
    </>
  )
}
