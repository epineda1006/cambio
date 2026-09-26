// TabBar.jsx: the bottom navigation, like most phone apps, because the
// bottom of the screen is where thumbs reach easily.
//
// It doesn't decide which screen is showing; App does. TabBar receives the
// current screen and a function to change it as PROPS (inputs passed from
// the parent component, like arguments to a function).

import { useLanguage } from '../i18n/languageContext.js'
import { CalculatorIcon, MapIcon } from './icons.jsx'

// The list of tabs as data, so adding a third screen later is one line.
const TABS = [
  { id: 'owner', labelKey: 'nav.owner', Icon: CalculatorIcon },
  { id: 'map', labelKey: 'nav.map', Icon: MapIcon },
]

export default function TabBar({ current, onChange }) {
  const { t } = useLanguage()

  return (
    <nav className="tab-bar" aria-label={t('nav.label')}>
      {TABS.map(({ id, labelKey, Icon }) => (
        <button
          key={id}
          type="button"
          // aria-current="page" tells screen readers "you are here".
          aria-current={current === id ? 'page' : undefined}
          onClick={() => onChange(id)}
        >
          <Icon />
          <span>{t(labelKey)}</span>
        </button>
      ))}
    </nav>
  )
}
