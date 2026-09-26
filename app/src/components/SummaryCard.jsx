// SummaryCard.jsx: the headline at the top of the Savings screen (and of
// the pitch video): total yearly savings and plastic avoided, using the best
// swap for each item. The totals come from summarize() in calculator.js;
// this component only displays them.

import { useLanguage } from '../i18n/languageContext.js'
import PlaceholderBadge from './PlaceholderBadge.jsx'

/**
 * Props:
 *   summary         the object returned by summarize()
 *   hasInput        true once at least one item has something to swap
 *   hasPlaceholder  true if any price in swaps.csv is still PLACEHOLDER
 */
export default function SummaryCard({ summary, hasInput, hasPlaceholder }) {
  const { t, tPlural, formatMoney, formatNumber } = useLanguage()

  return (
    // aria-live="polite": screen readers announce the new total when it
    // changes, after the person finishes typing.
    <section className="card summary-card" aria-live="polite">
      {hasPlaceholder && <PlaceholderBadge />}
      <h2>{t('summary.title')}</h2>

      {/* "A && B" shows B only when A is true; a common React shortcut. */}
      {!hasInput && <p className="muted">{t('summary.empty')}</p>}

      {hasInput && (
        <>
          <p className="summary-total">
            {/* Green only when there are real savings; $0 stays neutral. */}
            <span className={`summary-amount${summary.totalAnnualSavings > 0 ? ' positive' : ''}`}>
              {formatMoney(summary.totalAnnualSavings)}
            </span>{' '}
            <span className="muted">{t('summary.perYear')}</span>
          </p>
          <p className="summary-plastic">
            {t('summary.plastic', { count: formatNumber(summary.totalPlasticAvoided) })}
          </p>
          {summary.totalUpfrontCost > 0 && (
            <p className="muted">
              {t('summary.upfront', { amount: formatMoney(summary.totalUpfrontCost) })}
            </p>
          )}
          {summary.itemsWithoutSavingSwap > 0 && (
            <p className="note-negative">
              {tPlural('summary.noSavingSwap', summary.itemsWithoutSavingSwap)}
            </p>
          )}
          <p className="small muted">{t('summary.basis')}</p>
        </>
      )}
    </section>
  )
}
