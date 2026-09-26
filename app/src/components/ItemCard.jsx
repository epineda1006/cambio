// ItemCard.jsx: one disposable item (e.g. plastic cups): the owner's two
// inputs, then a result card for each possible swap.
//
// CONTROLLED INPUTS
// The number box and the slider don't keep their own value. OwnerTool holds
// the values in state and passes them in; when the owner types, onChange
// sends the new value back up. React state is then the single source of
// truth, so the results always match what's on screen.

import { useLanguage } from '../i18n/languageContext.js'
import SwapResult from './SwapResult.jsx'

/**
 * Props:
 *   item      { itemId, unitCost, swaps } from swaps.csv
 *   input     { weeklyQty: text typed so far, dineInPct: 0 to 100 }
 *   onChange  call with { weeklyQty } or { dineInPct } to update the input
 *   qty       weeklyQty already converted to a number
 *   results   evaluateSwap() results for each swap ([] if qty is 0)
 *   best      the best of those results (from pickBestSwap)
 */
export default function ItemCard({ item, input, onChange, qty, results, best }) {
  const { t, formatMoney, formatPercent } = useLanguage()
  const qtyId = `qty-${item.itemId}`
  const dineInId = `dinein-${item.itemId}`
  const nothingToSwap = qty > 0 && input.dineInPct === 0

  // Only label a "Best swap" when there is a real choice (2+ swaps) and the
  // winner actually saves money. Calling a money-losing swap "best" would
  // be misleading.
  const showBest = results.length > 1 && best?.paysBack

  return (
    <section className="card item-card">
      <h3>{t(`items.${item.itemId}`)}</h3>

      <div className="field">
        {/* htmlFor links the label to the input: tapping the label focuses
            the box, and screen readers read the label aloud. */}
        <label htmlFor={qtyId}>{t('owner.weeklyQty')}</label>
        <input
          id={qtyId}
          type="number"
          inputMode="numeric" // phones show the number keypad
          min="0"
          step="1"
          placeholder="0"
          value={input.weeklyQty}
          onChange={(e) => onChange({ weeklyQty: e.target.value })}
        />
      </div>

      <div className="field">
        <div className="field-row">
          <label htmlFor={dineInId}>{t('owner.dineInShare')}</label>
          <output htmlFor={dineInId}>{formatPercent(input.dineInPct / 100)}</output>
        </div>
        <input
          id={dineInId}
          type="range"
          min="0"
          max="100"
          step="5"
          value={input.dineInPct}
          onChange={(e) => onChange({ dineInPct: Number(e.target.value) })}
        />
        <p className="help">{t('owner.dineInHelp')}</p>
      </div>

      {qty > 0 && (
        <p className="muted">
          {t('owner.currentSpend', { amount: formatMoney(qty * item.unitCost * 52) })}
        </p>
      )}

      {nothingToSwap && <p className="note-negative">{t('owner.noDineIn')}</p>}

      {qty > 0 && !nothingToSwap && (
        <div className="swap-list">
          {results.map((result) => (
            <SwapResult
              key={result.swapId}
              swapId={result.swapId}
              result={result}
              isBest={showBest && result === best}
            />
          ))}
        </div>
      )}
    </section>
  )
}
