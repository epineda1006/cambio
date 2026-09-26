// OwnerTool.jsx: the Savings screen.
//
//   Summary card        total savings + plastic avoided (best swap per item)
//   Days open per week  one setting for the whole restaurant
//   Item cards          inputs + swap results for each disposable
//   Placeholder note    reminder that prices aren't real yet
//
// WHERE THE STATE LIVES
// This screen does NOT own the owner's inputs; App.jsx does, and passes them
// in as props. Why: when the owner taps the Map tab, React removes
// ("unmounts") this screen, and any state inside it is thrown away. State
// kept in App survives, because App is always on screen.
//
// STATE vs DERIVED VALUES
// Only the owner's inputs are stored in state (daysOpen and each item's
// quantity and dine-in share). Everything else (every result, the best swap,
// the summary) is DERIVED: recalculated from the inputs on every redraw.
// We never store results separately, so they can never get out of sync with
// the inputs. The math is fast, so recalculating each time is fine.

import ItemCard from '../components/ItemCard.jsx'
import SummaryCard from '../components/SummaryCard.jsx'
import { useLanguage } from '../i18n/languageContext.js'
import { evaluateSwap, pickBestSwap, summarize } from '../lib/calculator.js'
import { swapItems } from '../lib/loadSwaps.js'

const DAYS = [1, 2, 3, 4, 5, 6, 7]

// True if any price in swaps.csv is still marked PLACEHOLDER.
const HAS_PLACEHOLDER = swapItems.some((item) => item.swaps.some((swap) => swap.isPlaceholder))

// The number box holds whatever text was typed ("", "12", "-3"). Turn it
// into a safe whole number: empty, negative, or nonsense becomes 0.
function toQuantity(text) {
  const n = Math.floor(Number(text))
  return Number.isFinite(n) && n > 0 ? n : 0
}

/**
 * Props (all owned by App.jsx):
 *   daysOpen          1 to 7
 *   onDaysOpenChange  call with a new number of days
 *   inputs            { plastic_cups: { weeklyQty: '', dineInPct: 50 }, ... }
 *   onItemChange      call with (itemId, { weeklyQty } or { dineInPct })
 */
export default function OwnerTool({ daysOpen, onDaysOpenChange, inputs, onItemChange }) {
  const { t, formatNumber } = useLanguage()

  // ---- Derived values: recalculated on every redraw ----
  const itemResults = swapItems.map((item) => {
    const input = inputs[item.itemId]
    const qty = toQuantity(input.weeklyQty)
    const owner = {
      weeklyQty: qty,
      dineInShare: input.dineInPct / 100,
      unitCost: item.unitCost,
      daysOpen,
    }
    const results = qty > 0 ? item.swaps.map((swap) => evaluateSwap(owner, swap)) : []
    return { item, itemId: item.itemId, input, qty, swaps: results, best: pickBestSwap(results) }
  })

  const summary = summarize(itemResults)
  const hasInput = summary.itemsWithSavingSwap + summary.itemsWithoutSavingSwap > 0

  return (
    <section>
      <h1>{t('owner.title')}</h1>
      <p className="lead">{t('owner.intro')}</p>

      <SummaryCard summary={summary} hasInput={hasInput} hasPlaceholder={HAS_PLACEHOLDER} />

      <div className="card">
        <div className="field">
          <label htmlFor="days-open">{t('owner.daysOpen')}</label>
          {/* A <select> opens the phone's native picker, easy to use one-handed. */}
          <select
            id="days-open"
            value={daysOpen}
            onChange={(e) => onDaysOpenChange(Number(e.target.value))}
          >
            {DAYS.map((d) => (
              <option key={d} value={d}>
                {formatNumber(d)}
              </option>
            ))}
          </select>
          <p className="help">{t('owner.daysOpenHelp')}</p>
        </div>
      </div>

      {itemResults.map((r) => (
        <ItemCard
          key={r.itemId}
          item={r.item}
          input={r.input}
          onChange={(changes) => onItemChange(r.itemId, changes)}
          qty={r.qty}
          results={r.swaps}
          best={r.best}
        />
      ))}

      {HAS_PLACEHOLDER && <p className="small muted">{t('placeholder.explain')}</p>}
    </section>
  )
}
