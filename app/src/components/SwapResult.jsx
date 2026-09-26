// SwapResult.jsx: one swap's result card, e.g. "Glass cup: saves $1,246
// per year, pays for itself in 3.9 weeks".
//
// HONESTY RULE (from the README): if a swap saves nothing or loses money, we
// still show it and say so plainly, in red, instead of hiding it.

import { useLanguage } from '../i18n/languageContext.js'

/**
 * Props:
 *   swapId  which swap (its display name comes from the i18n files)
 *   result  the object returned by evaluateSwap() in calculator.js
 *   isBest  show the "Best swap" label on this card
 */
export default function SwapResult({ swapId, result, isBest }) {
  const { t, tPlural, formatMoney, formatNumber, formatDecimal } = useLanguage()
  const r = result

  // Pick the headline sentence and its color from the savings number.
  let headline
  let tone
  if (r.annualSavings > 0) {
    headline = t('swap.saves', { amount: formatMoney(r.annualSavings) })
    tone = 'positive'
  } else if (r.annualSavings < 0) {
    // Math.abs turns -11 into 11, because the sentence already says "more".
    headline = t('swap.costsMore', { amount: formatMoney(Math.abs(r.annualSavings)) })
    tone = 'negative'
  } else {
    headline = t('swap.breakEven')
    tone = 'negative'
  }

  return (
    // className can be built from values: "swap-card is-best" or "swap-card".
    <article className={`swap-card${isBest ? ' is-best' : ''}`}>
      <div className="swap-card-top">
        <h4>{t(`swaps.${swapId}`)}</h4>
        {isBest && <span className="badge badge-best">{t('swap.best')}</span>}
      </div>

      <p className={`swap-headline ${tone}`}>{headline}</p>

      <ul className="facts">
        <li>
          {r.paysBack
            ? t('swap.payback', { weeks: formatDecimal(r.paybackWeeks) })
            : t('swap.neverPaysBack')}
        </li>
        <li>
          {/* tPlural picks "1 reusable" vs "75 reusables". */}
          {tPlural('swap.upfront', r.itemsNeeded, {
            amount: formatMoney(r.upfrontCost),
            count: formatNumber(r.itemsNeeded),
          })}
        </li>
        <li>{t('swap.plastic', { count: formatNumber(r.plasticAvoidedPerYear) })}</li>
      </ul>

      {/* <details> is a built-in HTML element that opens and closes on tap,
          no JavaScript needed. It shows every step of the math, so an owner
          (or a judge) can check where the number came from. */}
      <details>
        <summary>{t('swap.details')}</summary>
        <dl className="breakdown">
          <dt>{t('swap.replacedPerWeek')}</dt>
          {/* One decimal, so a small number like 0.05 isn't shown as 0. */}
          <dd>{formatDecimal(r.replacedPerWeek)}</dd>
          <dt>{t('swap.itemsNeeded')}</dt>
          <dd>{formatNumber(r.itemsNeeded)}</dd>
          <dt>{t('swap.disposablesAvoided')}</dt>
          <dd>+{formatMoney(r.annualDisposablesAvoided)}</dd>
          <dt>{t('swap.washCost')}</dt>
          <dd>−{formatMoney(r.annualWashCost)}</dd>
          <dt>{t('swap.replacementCost')}</dt>
          <dd>−{formatMoney(r.annualReplacementCost)}</dd>
          <dt>{t('swap.savings')}</dt>
          <dd className={tone}>{formatMoney(r.annualSavings)}</dd>
        </dl>
      </details>
    </article>
  )
}
