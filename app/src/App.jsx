// A React "component" is just a function that returns what should appear on
// screen. The HTML-looking syntax below is called JSX: Vite converts it into
// regular JavaScript function calls before the browser sees it.
//
// Components are named with a capital letter (App, not app) so React can tell
// them apart from plain HTML tags like <main> or <h1>.
//
// All visible text comes from t('some.key'), which looks it up in
// i18n/en.json or i18n/es.json. Never type user-facing words directly here.

import LanguageToggle from './components/LanguageToggle.jsx'
import ThemeToggle from './components/ThemeToggle.jsx'
import { useLanguage } from './i18n/languageContext.js'

function App() {
  const { t } = useLanguage()

  return (
    <main>
      <LanguageToggle />
      <ThemeToggle />
      <h1>{t('app.name')}</h1>
      <p>{t('app.tagline')}</p>
    </main>
  )
}

// "export default" lets other files import this component (main.jsx does).
export default App
