// PlaceholderBadge.jsx: a warning-colored label that says the prices are
// examples, not real quotes. Shown whenever swaps.csv has a PLACEHOLDER row,
// so invented numbers are never presented as real (including in the video).

import { useLanguage } from '../i18n/languageContext.js'

export default function PlaceholderBadge() {
  const { t } = useLanguage()
  return <p className="badge badge-placeholder">{t('placeholder.badge')}</p>
}
