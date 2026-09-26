// StepResults.jsx: Step 3 of 3, "Your savings".
//
//   Green panel     "You could save $X a year ($Y a month)"
//   Results list    one row per item: its best swap (BEST tag), savings,
//                   pounds of plastic avoided, payback; "Compare N other
//                   options" opens the rest right there
//   Inset note      placeholder prices + the takeout share
//   Share my plan   phone share sheet, or copy the text
//   How we calculated this   every step of the math (a <details>)
//   Start over
//
// Every number comes from buildResults() in lib/results.js, which only
// combines the tested calculator functions. This file only displays them.
//
// HONESTY RULE (README): a swap that saves nothing or loses money is still
// shown, in red, and is never labeled BEST.

import { useState } from 'react'
import ShareButton from '../../components/ShareButton.jsx'
import SwapBreakdown from '../../components/SwapBreakdown.jsx'
import { useLanguage } from '../../i18n/languageContext.js'
import { HAS_PLACEHOLDER_DATA, buildResults } from '../../lib/results.js'
import { buildShareText } from '../../lib/shareText.js'

/**
 * Props:
 *   flow     the flow state from App (see lib/flow.js)
 *   onBack   go to Step 2
 *   onReset  clear every answer and go back to Step 1
 */
export default function StepResults({ flow, onBack, onReset }) {
  const { t, tPlural, language, formatMoney, formatNumber, formatDecimal, formatPercent } =
    useLanguage()

  // Which items have "Compare other options" open. A Set holds each id once.
  // This is just how the screen is showing things, so it can stay here.
  const [expanded, setExpanded] = useState(() => new Set())

  function toggleCompare(itemId) {
    // Make a NEW Set (React only notices replaced values, not edited ones).
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(itemId)) next.delete(itemId)
      else next.add(itemId)
      return next
    })
  }

  const results = buildResults(flow)
  const saves = results.totalAnnualSavings > 0

  // One sentence for a swap's money: saves / costs more / breaks even.
  function moneyLine(r) {
    if (r.annualSavings > 0) return t('results.saves', { amount: formatMoney(r.annualSavings) })
    if (r.annualSavings < 0) {
      return t('results.costsMore', { amount: formatMoney(Math.abs(r.annualSavings)) })
    }
    return t('results.breakEven')
  }

  function paybackLine(r) {
    return r.paysBack
      ? t('results.payback', { weeks: formatDecimal(r.paybackWeeks) })
      : t('results.neverPaysBack')
  }

  return (
    <>
      <button type="button" className="link-button back-link" onClick={onBack}>
        {t('flow.back')}
      </button>
      <h1 tabIndex={-1}>{t('results.title')}</h1>

      {/* ---- The headline panel ---- */}
      {saves ? (
        <div className="result-panel">
          <p className="result-panel-lead">{t('results.couldSave')}</p>
          <p className="result-panel-amount">
            {t('results.perYear', { amount: formatMoney(results.totalAnnualSavings) })}
          </p>
          <p>{t('results.perMonth', { amount: formatMoney(results.totalMonthlySavings) })}</p>
          {results.totalPounds > 0 && (
            <p>{t('results.pounds', { pounds: formatNumber(results.totalPounds) })}</p>
          )}
        </div>
      ) : (
        // No savings at all: a plain panel that says so, never a green $0.
        <div className="result-panel result-panel-neutral">
          <p className="result-panel-lead">{t('results.noSavings')}</p>
        </div>
      )}

      {/* ---- One row per item ---- */}
      <dl className="summary-list">
        {results.items.map((item) => {
          const itemName = t(`items.${item.itemId}`)
          const listId = `compare-${item.itemId}`
          const isOpen = expanded.has(item.itemId)
          const best = item.best

          return (
            <div className="summary-row result-row" key={item.itemId}>
              <dt className="summary-key">{itemName}</dt>
              <dd className="result-detail">
                {!best ? (
                  <p className="muted">{t('results.nothingToSwap')}</p>
                ) : (
                  <>
                    <p className="result-swap">
                      {t(`swaps.${best.swapId}`)}
                      {item.bestSavesMoney && (
                        <span className="tag tag-best">{t('results.best')}</span>
                      )}
                    </p>
                    {!item.bestSavesMoney && (
                      <p className="note-negative">{t('results.noSavingSwap')}</p>
                    )}
                    <ul className="result-facts">
                      <li className={best.annualSavings > 0 ? 'positive' : 'negative'}>
                        {moneyLine(best)}
                      </li>
                      <li>{t('results.poundsAvoided', { pounds: formatDecimal(best.pounds) })}</li>
                      <li>{paybackLine(best)}</li>
                    </ul>

                    {item.others.length > 0 && (
                      <>
                        {/* aria-expanded tells screen readers whether the
                            list below is open; aria-controls says which
                            list this button opens. */}
                        <button
                          type="button"
                          className="link-button"
                          aria-expanded={isOpen}
                          aria-controls={listId}
                          onClick={() => toggleCompare(item.itemId)}
                        >
                          {isOpen
                            ? t('results.hideCompare')
                            : tPlural('results.compare', item.others.length, {
                                count: formatNumber(item.others.length),
                              })}
                        </button>
                        {isOpen && (
                          <ul className="compare-list" id={listId}>
                            {item.others.map((r) => (
                              <li key={r.swapId}>
                                <span className="result-swap">{t(`swaps.${r.swapId}`)}</span>
                                <span className={r.annualSavings > 0 ? 'positive' : 'negative'}>
                                  {moneyLine(r)}
                                </span>
                                <span>{paybackLine(r)}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    )}
                  </>
                )}
              </dd>
            </div>
          )
        })}
      </dl>

      {/* ---- Side notes ---- */}
      <div className="inset-text">
        {HAS_PLACEHOLDER_DATA && <p>{t('results.placeholder')}</p>}
        <p>{t('results.takeout', { pct: formatPercent(results.takeoutPct / 100) })}</p>
      </div>

      {/* The shared text follows the language currently on screen. */}
      <ShareButton
        title={t('share.title')}
        text={buildShareText(results, language, HAS_PLACEHOLDER_DATA)}
      />

      {/* ---- Every step of the math ----
          <details> opens and closes on tap with no JavaScript. */}
      <details className="how">
        <summary>{t('results.howTitle')}</summary>
        {results.items
          .filter((item) => item.results.length > 0)
          .map((item) => (
            <section key={item.itemId} className="how-item">
              <h2>{t(`items.${item.itemId}`)}</h2>
              <p className="muted">
                {t('results.howBasis', {
                  weekly: formatNumber(item.weeklyQty),
                  pct: formatPercent(results.dineInPct / 100),
                  days: formatNumber(results.daysOpen),
                })}
              </p>
              {item.results.map((r) => (
                <div key={r.swapId} className="how-swap">
                  <h3>{t(`swaps.${r.swapId}`)}</h3>
                  <SwapBreakdown result={r} />
                </div>
              ))}
            </section>
          ))}
      </details>

      <button type="button" className="link-button" onClick={onReset}>
        {t('results.startOver')}
      </button>
    </>
  )
}
