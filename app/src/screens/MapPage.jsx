// MapPage.jsx: the Refill Map screen. Placeholder until the map data
// pipeline exists; step 9 adds the "coming soon" explanation.

import { useLanguage } from '../i18n/languageContext.js'

export default function MapPage() {
  const { t } = useLanguage()

  return (
    <section>
      <h1>{t('map.title')}</h1>
    </section>
  )
}
