// App.jsx: the app "shell", the parts that stay on screen everywhere:
//   header   (logo, app name, language toggle, theme toggle)
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
import LogoMark from './components/LogoMark.jsx'
import TabBar from './components/TabBar.jsx'
import ThemeToggle from './components/ThemeToggle.jsx'
import { useLanguage } from './i18n/languageContext.js'
import { INITIAL_FLOW } from './lib/flow.js'
import MapPage from './screens/MapPage.jsx'
import SavingsFlow from './screens/savings/SavingsFlow.jsx'

function App() {
  const { t } = useLanguage()

  // Which screen is showing: 'owner' or 'map'. There are only two screens,
  // so a piece of state is enough; no router library needed.
  const [screen, setScreen] = useState('owner')

  // Everything the owner has answered in the Savings flow, plus which step
  // they're on (shape described in lib/flow.js). It lives HERE, not inside
  // SavingsFlow: switching to the Map tab removes ("unmounts") SavingsFlow,
  // and a component's state is thrown away when it unmounts. App never
  // unmounts, so state kept here survives tab and step switches. This is
  // called "lifting state up".
  const [flow, setFlow] = useState(INITIAL_FLOW)

  // Merge in whatever changed, e.g. { daysOpen: 6 } or { step: 2 }. State
  // must be REPLACED, not changed in place, so React notices; the "..."
  // (spread) copies the old values and the new ones overwrite what changed.
  function updateFlow(changes) {
    setFlow((prev) => ({ ...prev, ...changes }))
  }

  function changeScreen(next) {
    setScreen(next)
    window.scrollTo(0, 0) // start the new screen at the top
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          {/* Logo slot: 32px, left of the wordmark. The mark is provisional. */}
          <span className="logo-slot">
            <LogoMark />
          </span>
          <span className="app-name">{t('app.name')}</span>
        </div>
        <div className="app-header-controls">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>

      <main className="app-main">
        {/* Conditional rendering: show one screen or the other depending on
            state. "condition ? A : B" is JavaScript's short if/else. */}
        {screen === 'owner' ? (
          <SavingsFlow flow={flow} onChange={updateFlow} />
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
