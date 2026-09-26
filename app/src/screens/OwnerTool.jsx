// OwnerTool.jsx: the calculator screen. Step 8 fills in the inputs,
// summary card, and swap results; for now it only shows its heading.

import { useLanguage } from '../i18n/languageContext.js'

export default function OwnerTool() {
  const { t } = useLanguage()

  return (
    <section>
      <h1>{t('owner.title')}</h1>
      <p className="lead">{t('app.tagline')}</p>
    </section>
  )
}
