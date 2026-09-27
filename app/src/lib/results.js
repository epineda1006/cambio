// results.js: everything Step 3 ("Your savings") shows, worked out from the
// owner's answers. A pure function: answers in, numbers out, no screen code,
// so it's easy to test and to reuse (e.g. for the "Share my plan" text).
//
// It only COMBINES existing pieces:
//   weeklyUsage()                 lib/flow.js       estimates + owner's numbers
//   evaluateSwap / pickBestSwap / summarize         lib/calculator.js (README math)
//   poundsOfPlastic / monthlyFromAnnual             lib/calculator.js
//   swapItems, itemProfilesById                     the two CSV files

import {
  evaluateSwap,
  monthlyFromAnnual,
  pickBestSwap,
  poundsOfPlastic,
  summarize,
} from './calculator.js'
import { weeklyUsage } from './flow.js'
import { assumptions } from './loadAssumptions.js'
import { itemProfiles } from './loadItems.js'
import { swapItems } from './loadSwaps.js'
import { handWashMinutesPerDay, withWashMethod } from './washing.js'

// True while any number in the data files is still marked PLACEHOLDER.
export const HAS_PLACEHOLDER_DATA =
  swapItems.some((item) => item.swaps.some((swap) => swap.isPlaceholder)) ||
  itemProfiles.some((profile) => profile.isPlaceholder) ||
  assumptions.isPlaceholder

// The real data from the two CSV files. Tests can pass their own data in the
// same shape instead (a "fixture"), e.g. prices where every swap loses money.
export const REAL_DATA = { swapItems, itemProfiles, assumptions }

/**
 * @param flow  the flow state from App (see lib/flow.js)
 * @param data  { swapItems, itemProfiles, assumptions }; defaults to the real
 *              CSV data
 * @returns {
 *   items: [{ itemId, weeklyQty, results, best, others, bestSavesMoney }],
 *     results = every swap's evaluateSwap() output plus `pounds`, `effort`,
 *               and `handWashMinutesPerDay` (0 unless washing by hand)
 *     best    = the best swap (pickBestSwap), or null if nothing to swap
 *     others  = the remaining swaps, in CSV order
 *   totalAnnualSavings, totalMonthlySavings, totalPounds, totalUpfrontCost,
 *   itemsWithoutSavingSwap, dineInPct, takeoutPct, daysOpen
 * }
 * Totals follow summarize(): only best swaps that actually save money count.
 */
export function buildResults(flow, data = REAL_DATA) {
  const usage = weeklyUsage(flow, data.itemProfiles)
  const profilesById = Object.fromEntries(data.itemProfiles.map((p) => [p.itemId, p]))
  const dineInShare = flow.dineInPct / 100

  const items = usage.map(({ itemId, weeklyQty }) => {
    const item = data.swapItems.find((i) => i.itemId === itemId)
    const { gramsEach } = profilesById[itemId]
    const owner = { weeklyQty, dineInShare, unitCost: item.unitCost, daysOpen: flow.daysOpen }

    const results =
      weeklyQty > 0
        ? item.swaps.map((swap) => {
            // Hand-wash owners pay staff time too; the calculator sees it as
            // a higher wash cost. Dishwasher owners get the swap unchanged.
            const washed = withWashMethod(swap, flow.washMethod, data.assumptions.handWashHourlyWage)
            const r = evaluateSwap(owner, washed)
            return {
              ...r,
              pounds: poundsOfPlastic(r.plasticAvoidedPerYear, gramsEach),
              effort: swap.effort,
              handWashMinutesPerDay:
                flow.washMethod === 'hand'
                  ? handWashMinutesPerDay(r.replacedPerWeek, swap.handWashSeconds, flow.daysOpen)
                  : 0,
            }
          })
        : []
    const best = pickBestSwap(results)

    return {
      itemId,
      weeklyQty,
      results,
      best,
      others: results.filter((r) => r !== best),
      bestSavesMoney: Boolean(best?.paysBack),
    }
  })

  // summarize() expects { swaps: [...] } per item.
  const summary = summarize(items.map((i) => ({ itemId: i.itemId, swaps: i.results })))
  const totalPounds = items
    .filter((i) => i.bestSavesMoney)
    .reduce((sum, i) => sum + i.best.pounds, 0) // reduce: add them all up

  return {
    items,
    totalAnnualSavings: summary.totalAnnualSavings,
    totalMonthlySavings: monthlyFromAnnual(summary.totalAnnualSavings),
    totalPounds,
    totalUpfrontCost: summary.totalUpfrontCost,
    itemsWithoutSavingSwap: summary.itemsWithoutSavingSwap,
    dineInPct: flow.dineInPct,
    takeoutPct: 100 - flow.dineInPct,
    daysOpen: flow.daysOpen,
  }
}
