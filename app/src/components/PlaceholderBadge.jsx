// PlaceholderBadge.jsx: a warning-colored label saying the data shown is an
// example, not real, so invented numbers are never presented as real
// (including in the video). Used on the Map screen; the Savings flow says
// the same thing in its inset notes.

import { useLanguage } from '../i18n/languageContext.js'

/**
 * Props:
 *   textKey  the i18n key of the message, e.g. 'map.placeholderData'
 */
export default function PlaceholderBadge({ textKey }) {
  const { t } = useLanguage()
  return <p className="badge badge-placeholder">{t(textKey)}</p>
}
