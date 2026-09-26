// StepUsage.jsx: Step 2 of 3, "What you use each week".
//
// Shows our estimate for each item (from Step 1's answers and the ratios in
// items.csv) as a SUMMARY LIST: one row per item with its name, the number,
// and a "Change" action. Owners who know their real numbers can correct
// any row; everyone else just taps "See my savings".
//
// Where things are kept:
//   - The owner's corrected numbers go into flow.overrides in App, so they
//     survive going back, switching tabs, and changing customers per day.
//   - Which row is open for editing, and the text typed so far, are kept
//     here: that's a half-finished edit, not an answer yet.

import { useState } from 'react'
import FieldError from '../../components/FieldError.jsx'
import { useLanguage } from '../../i18n/languageContext.js'
import { parseCustomers, validateWeekly, weeklyUsage } from '../../lib/flow.js'

/**
 * Props:
 *   flow        the flow state from App (see lib/flow.js)
 *   onChange    call with the fields that changed, e.g. { overrides: {...} }
 *   onBack      go to Step 1
 *   onContinue  go to Step 3
 */
export default function StepUsage({ flow, onChange, onBack, onContinue }) {
  const { t, formatNumber } = useLanguage()

  // The row being edited ({ itemId, text, error }), or null when none is.
  const [editing, setEditing] = useState(null)

  // Derived, not stored: recalculated from the answers on every redraw.
  const rows = weeklyUsage(flow)

  function startEditing(row) {
    setEditing({ itemId: row.itemId, text: String(row.weeklyQty), error: null })
  }

  // Try to save the open edit. Returns true if it saved (or nothing was open).
  function saveEdit() {
    if (!editing) return true
    const error = validateWeekly(editing.text)
    if (error) {
      setEditing({ ...editing, error })
      return false
    }
    onChange({ overrides: { ...flow.overrides, [editing.itemId]: editing.text.trim() } })
    setEditing(null)
    return true
  }

  // (Named "revert", not "useEstimate": React treats any function starting with
  // "use" as a hook, and hooks have special rules.)
  function revertToEstimate(itemId) {
    // Copy the overrides WITHOUT this item. The "rest" syntax collects every
    // other key into a new object; the _ name means "unused on purpose".
    const { [itemId]: _, ...rest } = flow.overrides
    onChange({ overrides: rest })
  }

  function handleContinue() {
    // If a row is still open, save it first so the owner's number isn't lost.
    if (saveEdit()) onContinue()
  }

  return (
    <>
      <button type="button" className="link-button back-link" onClick={onBack}>
        {t('flow.back')}
      </button>
      <h1 tabIndex={-1}>{t('usage.title')}</h1>
      <p className="lead">{t('usage.intro')}</p>

      {/* <dl> is a "description list": pairs of a term (<dt>) and its
          description (<dd>). Screen readers announce it as a list of name /
          value pairs, which is exactly what this is. */}
      <dl className="summary-list">
        {rows.map((row) => {
          const itemName = t(`items.${row.itemId}`)
          const isEditing = editing?.itemId === row.itemId
          const inputId = `weekly-${row.itemId}`

          return (
            <div className="summary-row" key={row.itemId}>
              <dt className="summary-key">{itemName}</dt>

              {isEditing ? (
                <dd className="summary-edit">
                  {/* A small form of its own, so Enter on the keyboard saves. */}
                  <form
                    noValidate
                    onSubmit={(e) => {
                      e.preventDefault()
                      saveEdit()
                    }}
                  >
                    <div className={`field${editing.error ? ' field-error' : ''}`}>
                      {/* The visible label is short ("Per week") because the item
                          name is right above it. Screen readers can't "see"
                          that, so aria-label on the input gives them the
                          full name, "Plastic cups per week". aria-label wins
                          over <label> for screen readers; the <label> still
                          makes tapping the words focus the box. */}
                      <label htmlFor={inputId}>{t('usage.perWeekLabel')}</label>
                      <FieldError id={`${inputId}-error`} error={editing.error} />
                      <input
                        id={inputId}
                        className="input-short"
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        spellCheck={false}
                        // autoFocus puts the cursor in the box right away.
                        autoFocus
                        aria-label={t('usage.editLabel', { item: itemName })}
                        value={editing.text}
                        onChange={(e) => setEditing({ ...editing, text: e.target.value })}
                        aria-describedby={editing.error ? `${inputId}-error` : undefined}
                        aria-invalid={editing.error ? true : undefined}
                      />
                    </div>
                    <div className="edit-actions">
                      <button type="submit" className="button button-inline">
                        {t('usage.save')}
                      </button>
                      <button type="button" className="link-button" onClick={() => setEditing(null)}>
                        {t('usage.cancel')}
                      </button>
                    </div>
                  </form>
                </dd>
              ) : (
                <>
                  <dd className="summary-value">
                    {t('usage.perWeek', { count: formatNumber(row.weeklyQty) })}
                    <span className={`tag${row.isOverride ? ' tag-entered' : ''}`}>
                      {t(row.isOverride ? 'usage.entered' : 'usage.estimated')}
                    </span>
                  </dd>
                  <dd className="summary-actions">
                    <button type="button" className="link-button" onClick={() => startEditing(row)}>
                      {t('usage.change')}
                      {/* Sighted people see which row this is; screen-reader
                          users hear "Change Plastic cups" instead of three
                          identical "Change" links. The space goes OUTSIDE
                          the hidden span, or it gets trimmed away. */}
                      {' '}
                      <span className="visually-hidden">{itemName}</span>
                    </button>
                    {row.isOverride && (
                      <button
                        type="button"
                        className="link-button"
                        onClick={() => revertToEstimate(row.itemId)}
                      >
                        {t('usage.useEstimate', { count: formatNumber(row.estimate) })}
                        {' '}
                        <span className="visually-hidden">{itemName}</span>
                      </button>
                    )}
                  </dd>
                </>
              )}
            </div>
          )
        })}
      </dl>

      {/* Inset text: a side note set off with a thick left border. */}
      <div className="inset-text">
        <p>
          {t('usage.basis', {
            customers: formatNumber(parseCustomers(flow.customersPerDay) ?? 0),
            days: formatNumber(flow.daysOpen ?? 0),
          })}
        </p>
        <p>{t('usage.placeholder')}</p>
      </div>

      <button type="button" className="button" onClick={handleContinue}>
        {t('usage.continue')}
      </button>
    </>
  )
}
