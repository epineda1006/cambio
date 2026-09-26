// App.jsx: the app "shell", the parts that stay on screen everywhere:
//   header   (app name, language toggle, theme toggle)
//   main     (whichever screen is selected)
//   tab bar  (switches screens, fixed to the bottom of the phone)
//
// A React "component" is just a function that returns what should appear on
// screen, written in JSX (the HTML-looking syntax). Components are named
// with a capital letter so React can tell them apart from HTML tags.
//
// All visible text comes from t('some.key'), which looks it up in
// i18n/en.json or i18n/es.json. Never type user-facing words directly here.

import { useState } from 'react'
import LanguageToggle from './components/LanguageToggle.jsx'
import TabBar from './components/TabBar.jsx'
import ThemeToggle from './components/ThemeToggle.jsx'
import { useLanguage } from './i18n/languageContext.js'
import { swapItems } from './lib/loadSwaps.js'
import MapPage from './screens/MapPage.jsx'
import OwnerTool from './screens/OwnerTool.jsx'

const DEFAULT_DAYS_OPEN = 7
const DEFAULT_DINE_IN_PCT = 50

// One entry per item: { plastic_cups: { weeklyQty: '', dineInPct: 50 }, ... }
// Object.fromEntries turns a list of [key, value] pairs into an object.
function createDefaultInputs() {
  return Object.fromEntries(
    swapItems.map((item) => [item.itemId, { weeklyQty: '', dineInPct: DEFAULT_DINE_IN_PCT }]),
  )
}

function App() {
  const { t } = useLanguage()

  // Which screen is showing: 'owner' or 'map'. There are only two screens,
  // so a piece of state is enough; no router library needed.
  const [screen, setScreen] = useState('owner')

  // The owner's Savings inputs live HERE, not inside OwnerTool. Switching to
  // the Map tab removes ("unmounts") OwnerTool, and a component's state is
  // thrown away when it unmounts. App never unmounts, so state kept here
  // survives tab switches. This is called "lifting state up".
  const [daysOpen, setDaysOpen] = useState(DEFAULT_DAYS_OPEN)
  const [inputs, setInputs] = useState(createDefaultInputs)

  // Update one field of one item. State must be REPLACED, not changed in
  // place, so React notices; the "..." (spread) copies the old values and the
  // new ones overwrite just what changed.
  function updateItem(itemId, changes) {
    setInputs((prev) => ({ ...prev, [itemId]: { ...prev[itemId], ...changes } }))
  }

  function changeScreen(next) {
    setScreen(next)
    window.scrollTo(0, 0) // start the new screen at the top
  }

  return (
    <div className="app">
      <header className="app-header">
        <span className="app-name">{t('app.name')}</span>
        <div className="app-header-controls">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>

      <main className="app-main">
        {/* Conditional rendering: show one screen or the other depending on
            state. "condition ? A : B" is JavaScript's short if/else. */}
        {screen === 'owner' ? (
          <OwnerTool
            daysOpen={daysOpen}
            onDaysOpenChange={setDaysOpen}
            inputs={inputs}
            onItemChange={updateItem}
          />
        ) : (
          <MapPage />
        )}
      </main>

      {/* Passing props: TabBar gets the current screen and a function it
          calls when a tab is tapped. The state itself stays here in App. */}
      <TabBar current={screen} onChange={changeScreen} />
    </div>
  )
}

// "export default" lets other files import this component (main.jsx does).
export default App
