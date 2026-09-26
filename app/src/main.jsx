// main.jsx is the entry point: the first JavaScript file the browser runs.
// index.html has an empty <div id="root"></div>, and this file tells React
// to take over that div and draw our <App /> component inside it.

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  // StrictMode is a development-only helper. It runs some code twice on
  // purpose to surface bugs early. It has no effect in the production build.
  <StrictMode>
    <App />
  </StrictMode>,
)
