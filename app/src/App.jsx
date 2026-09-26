// A React "component" is just a function that returns what should appear on
// screen. The HTML-looking syntax below is called JSX: Vite converts it into
// regular JavaScript function calls before the browser sees it.
//
// Components are named with a capital letter (App, not app) so React can tell
// them apart from plain HTML tags like <main> or <h1>.
//
// TEMPORARY: the text below is hardcoded only until step 5, when every
// user-facing string moves into i18n/en.json and i18n/es.json.
function App() {
  return (
    <main>
      <h1>Cambio</h1>
    </main>
  )
}

// "export default" lets other files import this component (main.jsx does).
export default App
