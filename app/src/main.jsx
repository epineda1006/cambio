// main.jsx is the entry point: the first JavaScript file the browser runs.
// index.html has an empty <div id="root"></div>, and this file tells React
// to take over that div and draw our <App /> component inside it.

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Importing a .css file from JavaScript is a Vite feature: it adds the styles
// to the page (and bundles them into dist/ for production).
//
// The two @fontsource imports bring in the Public Sans font files from the
// npm package, weights 400 (regular) and 500 (medium) only. Vite copies
// them into the build, so the font ships WITH the app: no request to
// Google Fonts, and it works offline. Each file only downloads the letters
// a page actually uses (Latin covers Spanish accents, ñ, ¿ and ¡).
import '@fontsource/public-sans/400.css'
import '@fontsource/public-sans/500.css'
import './styles.css'
import App from './App.jsx'
import LanguageProvider from './i18n/LanguageProvider.jsx'

createRoot(document.getElementById('root')).render(
  // StrictMode is a development-only helper. It runs some code twice on
  // purpose to surface bugs early. It has no effect in the production build.
  <StrictMode>
    {/* LanguageProvider wraps App so every component can call useLanguage(). */}
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>,
)
