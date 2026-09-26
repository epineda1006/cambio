// SwapBreakdown.jsx: every step of one swap's math, as a two-column table
// ("label ... number"). Shown inside "How we calculated this" so an owner,
// or a judge, can check exactly where a savings number came from.
//
// The numbers are the ones evaluateSwap() in calculator.js already returns;
// this component only formats them.

import { useLanguage } from '../i18n/languageContext.js'

/**
 * Props:
 *   result  one evaluateSwap() result. If it also has `pounds` (added by
 *           lib/results.js), a "plastic avoided" row is shown too.
 */
export default function SwapBreakdown({ result: r }) {
  const { t, formatNumber, formatDecimal, formatMoney } = useLanguage()
  const tone = r.annualSavings > 0 ? 'positive' : 'negative'

  return (
    <dl className="breakdown">
      <dt>{t('swap.replacedPerWeek')}</dt>
      {/* One decimal, so a small number like 0.05 isn't shown as 0. */}
      <dd>{formatDecimal(r.replacedPerWeek)}</dd>
      <dt>{t('swap.itemsNeeded')}</dt>
      <dd>{formatNumber(r.itemsNeeded)}</dd>
      {r.pounds !== undefined && (
        <>
          <dt>{t('swap.pounds')}</dt>
          <dd>{formatDecimal(r.pounds)}</dd>
        </>
      )}
      <dt>{t('swap.disposablesAvoided')}</dt>
      <dd>+{formatMoney(r.annualDisposablesAvoided)}</dd>
      <dt>{t('swap.washCost')}</dt>
      <dd>−{formatMoney(r.annualWashCost)}</dd>
      <dt>{t('swap.replacementCost')}</dt>
      <dd>−{formatMoney(r.annualReplacementCost)}</dd>
      {/* The last row is the result; styles.css makes it stand out. */}
      <dt>{t('swap.savings')}</dt>
      <dd className={tone}>{formatMoney(r.annualSavings)}</dd>
    </dl>
  )
}
