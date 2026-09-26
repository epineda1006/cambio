// ErrorSummary.jsx: the "There is a problem" box shown at the top of a form
// when Continue finds missing or wrong answers.
//
// This is a well-tested pattern from government service design:
//   1. The box lists every problem, in the same order as the questions.
//   2. Each problem is a link that jumps to (and focuses) the field to fix.
//   3. The same message also appears next to the field itself.
//   4. When the box appears, keyboard and screen-reader focus moves to it,
//      so nobody misses that something went wrong.

import { useEffect, useRef } from 'react'
import { useLanguage } from '../i18n/languageContext.js'

/**
 * Props:
 *   errors  [{ field, key, vars }] from validateBusiness() in lib/flow.js.
 *           `field` is the id of the input to jump to.
 */
export default function ErrorSummary({ errors }) {
  const { t } = useLanguage()
  // useRef gives us a handle on the real page element, so we can focus it.
  const boxRef = useRef(null)

  // Every time a new list of errors arrives, move focus to the box.
  useEffect(() => {
    boxRef.current?.focus()
  }, [errors])

  function jumpTo(event, fieldId) {
    // Normally a link changes the page address; we only want to move focus.
    event.preventDefault()
    const field = document.getElementById(fieldId)
    field?.focus()
    field?.scrollIntoView({ block: 'center' })
  }

  return (
    // tabIndex={-1} lets code (not the Tab key) focus this box.
    // role="alert" makes screen readers announce it right away.
    <div className="error-summary" ref={boxRef} tabIndex={-1} role="alert">
      <h2>{t('errors.summaryTitle')}</h2>
      <ul>
        {errors.map((error) => (
          <li key={error.field}>
            <a href={`#${error.field}`} onClick={(e) => jumpTo(e, error.field)}>
              {t(error.key, error.vars)}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
