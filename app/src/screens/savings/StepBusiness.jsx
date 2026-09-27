// StepBusiness.jsx: Step 1 of 3, "Your business". Three questions an owner
// can answer without looking anything up:
//   - customers a day (typed)
//   - days open per week (1 to 7)
//   - for here or to go (three choices, none preselected)
//
// The answers live in App (passed in as `flow`), so they survive switching
// steps or tabs. The only thing this component keeps for itself is the list
// of errors from the last Continue press: that's temporary screen feedback,
// not an answer, so it's fine to lose.

import { useState } from 'react'
import ErrorSummary from '../../components/ErrorSummary.jsx'
import FieldError from '../../components/FieldError.jsx'
import { useLanguage } from '../../i18n/languageContext.js'
import { DAYS_CHOICES, DINE_IN_CHOICES, validateBusiness } from '../../lib/flow.js'

/**
 * Props:
 *   flow        the flow state from App (see lib/flow.js)
 *   onChange    call with the fields that changed, e.g. { daysOpen: 6 }
 *   onContinue  call when all answers are valid
 */
export default function StepBusiness({ flow, onChange, onContinue }) {
  const { t, formatNumber, formatPercent } = useLanguage()
  const [errors, setErrors] = useState([])

  // Find the error (if any) for one question. Field ids start with the
  // question's name: 'customers', 'days-1', 'dinein-20'.
  const errorFor = (prefix) => errors.find((e) => e.field.startsWith(prefix))
  const customersError = errorFor('customers')
  const daysError = errorFor('days')
  const dineInError = errorFor('dinein')

  function handleSubmit(event) {
    // A <form> normally reloads the page on submit; we handle it ourselves.
    event.preventDefault()
    const found = validateBusiness(flow)
    setErrors(found)
    if (found.length === 0) onContinue()
  }

  return (
    // noValidate turns off the browser's own pop-up checks, so our clearer,
    // translated messages are the only ones people see.
    <form onSubmit={handleSubmit} noValidate>
      {errors.length > 0 && <ErrorSummary errors={errors} />}

      <h1 tabIndex={-1}>{t('business.title')}</h1>

      {/* ---- Customers a day ---- */}
      <div className={`field${customersError ? ' field-error' : ''}`}>
        <label htmlFor="customers">{t('business.customersLabel')}</label>
        <p className="help" id="customers-hint">
          {t('business.customersHint')}
        </p>
        <FieldError id="customers-error" error={customersError} />
        <input
          id="customers"
          className="input-short"
          // type="text" + inputMode="numeric": phones show the number
          // keypad, but without type="number"'s spinner arrows and its habit
          // of changing the value when you scroll over it.
          type="text"
          inputMode="numeric"
          autoComplete="off"
          spellCheck={false}
          value={flow.customersPerDay}
          onChange={(e) => onChange({ customersPerDay: e.target.value })}
          // aria-describedby: screen readers read the hint (and the error,
          // if there is one) when this box is focused.
          aria-describedby={customersError ? 'customers-hint customers-error' : 'customers-hint'}
          aria-invalid={customersError ? true : undefined}
        />
      </div>

      {/* ---- Days open: 1 to 7 ----
          A <fieldset> groups related choices, and its <legend> is the
          question. They are real radio buttons (only one can be picked, and
          arrow keys move between them) that are STYLED to look like big
          buttons. */}
      <fieldset
        className={`field${daysError ? ' field-error' : ''}`}
        aria-describedby={daysError ? 'days-error' : undefined}
      >
        <legend>{t('business.daysLegend')}</legend>
        <FieldError id="days-error" error={daysError} />
        <div className="option-buttons">
          {DAYS_CHOICES.map((days) => (
            <div key={days} className="option-button">
              <input
                type="radio"
                id={`days-${days}`}
                name="days"
                value={days}
                checked={flow.daysOpen === days}
                onChange={() => onChange({ daysOpen: days })}
              />
              <label htmlFor={`days-${days}`}>{formatNumber(days)}</label>
            </div>
          ))}
        </div>
      </fieldset>

      {/* ---- For here or to go ---- */}
      <fieldset
        className={`field${dineInError ? ' field-error' : ''}`}
        aria-describedby={dineInError ? 'dinein-hint dinein-error' : 'dinein-hint'}
      >
        <legend>{t('business.dineInLegend')}</legend>
        <p className="help" id="dinein-hint">
          {t('business.dineInHint')}
        </p>
        <FieldError id="dinein-error" error={dineInError} />
        <div className="radios">
          {DINE_IN_CHOICES.map(({ pct, key }) => (
            <div key={pct} className="radio">
              <input
                type="radio"
                id={`dinein-${pct}`}
                name="dinein"
                value={pct}
                checked={flow.dineInPct === pct}
                onChange={() => onChange({ dineInPct: pct })}
                aria-describedby={`dinein-${pct}-hint`}
              />
              <label htmlFor={`dinein-${pct}`}>
                {t(`business.choices.${key}.label`)}
                <span className="radio-hint" id={`dinein-${pct}-hint`}>
                  {t(`business.choices.${key}.hint`, { pct: formatPercent(pct / 100) })}
                </span>
              </label>
            </div>
          ))}
        </div>
      </fieldset>

      <button type="submit" className="button">
        {t('flow.continue')}
      </button>
    </form>
  )
}
