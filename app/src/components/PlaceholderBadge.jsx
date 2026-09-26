// PlaceholderBadge.jsx: a warning-colored label that says the data is an
// example, not real. Shown whenever swaps.csv has a PLACEHOLDER row (or the
// map data is a placeholder), so invented numbers are never presented as
// real (including in the video).
//
// textKey is optional: it defaults to the prices message, and the Map screen
// passes its own.

import { useLanguage } from '../i18n/languageContext.js'

export default function PlaceholderBadge({ textKey = 'placeholder.badge' }) {
  const { t } = useLanguage()
  return <p className="badge badge-placeholder">{t(textKey)}</p>
}
