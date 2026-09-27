// StepFirstSwitch.jsx: Step 4 of 4, "Your first switch". Turns the numbers
// into ONE concrete move for Monday morning.
//
//   Two takeout questions   extras in every bag? delivery apps?
//   A. The pick             the easy swap that saves the most, OR "forks and
//                           sauce only when asked", OR an honest "nothing
//                           easy saves money yet" (plus a bigger step, if a
//                           harder swap does save money)
//   B. Checklist            what to do, with real quantities
//   C. Takeout              what giving extras only on request saves, what
//                           two California laws say, and a note on materials
//   D. Join the pilot       text us / fill out a form ("Coming soon" until
//                           config/pilot.js has the team's real details)
//   E. Placeholder note, Back to your savings, Start over
//
// Sections A to E only appear once both questions are answered, because
// the answers can change the pick, the checklist, and the takeout numbers.
//
// Every decision comes from tested pure functions: buildResults()
// (lib/results.js), takeoutExtras() (lib/takeout.js), and pickFirstSwitch()
// + buildChecklist() (lib/firstSwitch.js). This file only displays them.

import { useState } from 'react'
import { PILOT, buildSmsLink, isPilotReady } from '../../config/pilot.js'
import { useLanguage } from '../../i18n/languageContext.js'
import { buildChecklist, pickFirstSwitch } from '../../lib/firstSwitch.js'
import { DELIVERY_CHOICES, EXTRAS_CHOICES } from '../../lib/flow.js'
import { HAS_PLACEHOLDER_DATA, REAL_DATA, buildResults } from '../../lib/results.js'
import { takeoutExtras } from '../../lib/takeout.js'

// The two California laws in the takeout section. Links go to the official
// bill pages on leginfo.legislature.ca.gov. The on-screen notes say only
// what each law requires or allows (see docs/decisions.md).
const LAWS = [
  {
    id: 'ab1276',
    url: 'https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202120220AB1276',
  },
  {
    id: 'ab619',
    url: 'https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=201920200AB619',
  },
]

/**
 * Props:
 *   flow      the flow state from App (see lib/flow.js)
 *   onChange  call with the fields that changed, e.g. { extrasAuto: 'yes' }
 *   onBack    go to Step 3
 *   onReset   clear every answer and go back to Step 1
 *   data      optional { swapItems, itemProfiles, assumptions }, for tests
 *   pilot     optional { smsNumber, formUrl }, for tests; the app always
 *             uses config/pilot.js
 */
export default function StepFirstSwitch({
  flow,
  onChange,
  onBack,
  onReset,
  data = REAL_DATA,
  pilot = PILOT,
}) {
  const { t } = useLanguage()
  const answered = flow.extrasAuto !== null && flow.deliveryApps !== null

  return (
    <>
      <button type="button" className="link-button back-link" onClick={onBack}>
        {t('flow.back')}
      </button>
      <h1 tabIndex={-1}>{t('firstSwitch.title')}</h1>
      <p>{t('firstSwitch.intro')}</p>

      <Question
        name="extras"
        legend={t('firstSwitch.extrasLegend')}
        choices={EXTRAS_CHOICES}
        labelFor={(choice) => t(`firstSwitch.extras.${choice}`)}
        value={flow.extrasAuto}
        onPick={(choice) => onChange({ extrasAuto: choice })}
      />
      <Question
        name="delivery"
        legend={t('firstSwitch.deliveryLegend')}
        choices={DELIVERY_CHOICES}
        labelFor={(choice) => t(`firstSwitch.delivery.${choice}`)}
        value={flow.deliveryApps}
        onPick={(choice) => onChange({ deliveryApps: choice })}
      />

      {/* The plan appears right AFTER the questions in the page, so a screen
          reader user who answers the second one simply keeps reading down. */}
      {answered && (
        <>
          <Plan flow={flow} data={data} pilot={pilot} />

          {/* ---- E. The way out ---- */}
          {HAS_PLACEHOLDER_DATA && (
            <div className="inset-text">
              <p>{t('firstSwitch.placeholder')}</p>
            </div>
          )}
          <div className="end-links">
            <button type="button" className="link-button" onClick={onBack}>
              {t('firstSwitch.backToSavings')}
            </button>
            <button type="button" className="link-button" onClick={onReset}>
              {t('results.startOver')}
            </button>
          </div>
        </>
      )}
    </>
  )
}

/** One question with big radio buttons (same look as Step 1). */
function Question({ name, legend, choices, labelFor, value, onPick }) {
  return (
    <fieldset className="field">
      <legend>{legend}</legend>
      <div className="radios">
        {choices.map((choice) => (
          <div key={choice} className="radio">
            <input
              type="radio"
              id={`${name}-${choice}`}
              name={name}
              value={choice}
              checked={value === choice}
              onChange={() => onPick(choice)}
            />
            <label htmlFor={`${name}-${choice}`}>{labelFor(choice)}</label>
          </div>
        ))}
      </div>
    </fieldset>
  )
}

/** Sections A (the pick), B (the checklist), C (takeout), D (the pilot). */
function Plan({ flow, data, pilot }) {
  const { t } = useLanguage()
  const results = buildResults(flow, data)
  const extras = takeoutExtras(flow, data)
  const pick = pickFirstSwitch(results, extras)
  const checklist = buildChecklist(pick, flow.deliveryApps)

  return (
    <>
      {/* ---- A. The pick ---- */}
      {pick.kind === 'swap' && (
        <>
          <h2>{t('firstSwitch.startHere')}</h2>
          <SwapCard itemId={pick.itemId} swap={pick.swap} reason={t('firstSwitch.whySwap')} />
        </>
      )}

      {pick.kind === 'extras' && (
        <>
          <h2>{t('firstSwitch.startHere')}</h2>
          <ExtrasCard savings={extras.totalAnnualSavings} />
        </>
      )}

      {pick.kind === 'none' && (
        <>
          {/* Honest, and positive when they're already doing the right thing. */}
          <div className="pick-card pick-card-neutral">
            <p>{t(flow.extrasAuto === 'ifAsked' ? 'firstSwitch.noneAhead' : 'firstSwitch.none')}</p>
          </div>
          {/* Only offered when a medium or hard swap really saves money. */}
          {pick.biggerStep && (
            <>
              <h2>{t('firstSwitch.biggerTitle')}</h2>
              <SwapCard itemId={pick.biggerStep.itemId} swap={pick.biggerStep} showWhatItTakes />
            </>
          )}
        </>
      )}

      {/* ---- B. Checklist ---- */}
      {checklist.length > 0 && <Checklist items={checklist} />}

      {/* ---- C. Takeout ---- */}
      <Takeout extras={extras} />

      {/* ---- D. Join the pilot ---- */}
      <JoinPilot pilot={pilot} nothingEasy={pick.kind === 'none'} />
    </>
  )
}

/**
 * Takeout, in the order we recommend (see docs/decisions.md): REDUCE first
 * (extras only on request), then REUSE (customers' own containers), then
 * better MATERIALS (once we know what Fresno's compost accepts).
 */
function Takeout({ extras }) {
  const { t, formatMoney } = useLanguage()
  return (
    <>
      <h2>{t('firstSwitch.takeoutTitle')}</h2>
      {/* Only when extras go in every bag today; otherwise there's nothing
          to save, and $0 would just be noise. */}
      {extras.automatic && extras.totalAnnualSavings > 0 && (
        <p>
          {t('firstSwitch.extrasSavings', {
            amount: formatMoney(extras.totalAnnualSavings),
          })}
        </p>
      )}
      <ul className="law-list">
        {LAWS.map((law) => (
          <li key={law.id}>
            <p>{t(`firstSwitch.laws.${law.id}.text`)}</p>
            {/* target="_blank" opens a new tab, so the owner's answers
                stay here. rel="noopener noreferrer" stops the new page
                from reaching back into ours (a standard safety habit). The
                link text says it opens a new tab, so nobody is surprised. */}
            <a href={law.url} target="_blank" rel="noopener noreferrer">
              {t(`firstSwitch.laws.${law.id}.link`)}
            </a>
          </li>
        ))}
      </ul>
      <p>{t('firstSwitch.materials')}</p>
    </>
  )
}

/**
 * Join the pilot. While config/pilot.js still says PLACEHOLDER, the buttons
 * are disabled and say "Coming soon", and a note says why, so nothing ever
 * opens a fake number or form.
 */
function JoinPilot({ pilot, nothingEasy }) {
  const { t } = useLanguage()
  const ready = isPilotReady(pilot)

  return (
    <>
      <h2>{t('firstSwitch.pilotTitle')}</h2>
      <p>{t(nothingEasy ? 'firstSwitch.pilotHelpFind' : 'firstSwitch.pilotHelp')}</p>
      {ready ? (
        <div className="button-stack">
          {/* sms: opens the Messages app with our number and a message
              already typed, in the language on screen. */}
          <a className="button" href={buildSmsLink(pilot.smsNumber, t('firstSwitch.smsMessage'))}>
            {t('firstSwitch.textUs')}
          </a>
          <a
            className="button button-secondary"
            href={pilot.formUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('firstSwitch.form')}
          </a>
        </div>
      ) : (
        <>
          <div className="button-stack">
            <button type="button" className="button" disabled>
              {t('firstSwitch.textUsSoon')}
            </button>
            <button type="button" className="button button-secondary" disabled>
              {t('firstSwitch.formSoon')}
            </button>
          </div>
          <p className="muted">{t('firstSwitch.pilotSoon')}</p>
        </>
      )}
    </>
  )
}

/** Effort tag, e.g. "Effort: easy". */
function EffortTag({ effort }) {
  const { t } = useLanguage()
  return <span className="tag">{t(`firstSwitch.effort.${effort}`)}</span>
}

/**
 * One swap: its name, effort, and what it saves. `swap` is a result from
 * buildResults() (evaluateSwap output plus effort and handWashMinutesPerDay).
 * showWhatItTakes: for the bigger step, spell out what buying in means.
 */
function SwapCard({ itemId, swap, reason, showWhatItTakes = false }) {
  const { t, tPlural, formatMoney, formatNumber, formatDecimal } = useLanguage()
  // Hand-wash time, in whole minutes (at least 1, so it never says "0").
  const minutes = Math.max(1, Math.round(swap.handWashMinutesPerDay))

  return (
    <div className="pick-card">
      <p className="pick-title">
        {t(`swaps.${swap.swapId}`)} <EffortTag effort={swap.effort} />
      </p>
      <p className="muted">{t('firstSwitch.insteadOf', { item: t(`items.${itemId}`) })}</p>
      {reason && <p>{reason}</p>}
      <ul className="result-facts">
        <li className="positive">
          {t('results.saves', { amount: formatMoney(swap.annualSavings) })}
        </li>
        <li>{t('results.payback', { weeks: formatDecimal(swap.paybackWeeks) })}</li>
        {showWhatItTakes && (
          <>
            <li>
              {t('checklist.buy', {
                units: tPlural(`units.${swap.swapId}`, swap.itemsNeeded, {
                  count: formatNumber(swap.itemsNeeded),
                }),
              })}
            </li>
            <li>
              {t('firstSwitch.upfront', {
                amount: formatMoney(swap.upfrontCost),
              })}
            </li>
          </>
        )}
        {swap.handWashMinutesPerDay > 0 && (
          <li>
            {tPlural('firstSwitch.handWash', minutes, {
              count: formatNumber(minutes),
            })}
          </li>
        )}
      </ul>
    </div>
  )
}

/** The takeout pick: forks and sauce only when the customer asks. */
function ExtrasCard({ savings }) {
  const { t, formatMoney } = useLanguage()
  return (
    <div className="pick-card">
      <p className="pick-title">
        {t('firstSwitch.extrasTitle')} <EffortTag effort="easy" />
      </p>
      <p>{t('firstSwitch.whyExtras')}</p>
      <ul className="result-facts">
        <li className="positive">{t('results.saves', { amount: formatMoney(savings) })}</li>
      </ul>
    </div>
  )
}

/**
 * Real checkboxes, so they work with a keyboard and screen readers. Which
 * ones are ticked is only kept on this screen (useState), on purpose: it's
 * a to-do aid, not an answer, and the hint says it isn't saved.
 */
function Checklist({ items }) {
  const { t, tPlural, formatNumber } = useLanguage()
  const [done, setDone] = useState(() => new Set())

  function toggle(key) {
    // A NEW Set each time: React only notices replaced values.
    setDone((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // The text for one line. "Buy about 45 reusable baskets" needs the count
  // AND the right singular/plural name for it. In Spanish the word before
  // the number changes with the noun's GENDER too ("unos 45 vasos" but
  // "unas 45 canastas"), so the whole phrase lives in the units.* strings.
  function text({ key, vars }) {
    if (key !== 'checklist.buy') return t(key)
    return t(key, {
      units: tPlural(`units.${vars.swapId}`, vars.count, {
        count: formatNumber(vars.count),
      }),
    })
  }

  return (
    <>
      {/* A real <h2> (so heading navigation finds it), and role="group" +
          aria-labelledby to tell screen readers the boxes belong to it. */}
      <h2 id="checklist-title">{t('firstSwitch.checklistTitle')}</h2>
      <p className="help">{t('firstSwitch.checklistHint')}</p>
      <div className="checkboxes" role="group" aria-labelledby="checklist-title">
        {items.map((item) => {
          const id = `check-${item.key.split('.')[1]}`
          return (
            <div key={item.key} className="checkbox">
              <input
                type="checkbox"
                id={id}
                checked={done.has(item.key)}
                onChange={() => toggle(item.key)}
              />
              <label htmlFor={id}>{text(item)}</label>
            </div>
          )
        })}
      </div>
    </>
  )
}
