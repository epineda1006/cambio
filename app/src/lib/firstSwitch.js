// firstSwitch.js: Step 4 picks ONE first move for the owner, plus a
// checklist for it. Pure functions: results in, a decision out.
//
// The pick, in order:
//   1. 'swap'   the EASY swap that saves the most money per year (any item)
//   2. 'extras' if no easy swap saves money but extras go in every bag:
//               give forks and sauce only on request
//   3. 'none'   neither saves money. Optionally a `biggerStep`: the best
//               medium or hard swap that does save money, shown as
//               "a bigger step, if you're ready"

import { pickBestSwap } from './calculator.js'

// Every swap result from buildResults(), each tagged with its item.
function allSwaps(results) {
  return results.items.flatMap((item) => item.results.map((r) => ({ ...r, itemId: item.itemId })))
}

/**
 * @param results  what buildResults() returns (lib/results.js)
 * @param extras   what takeoutExtras() returns (lib/takeout.js)
 * @returns { kind: 'swap', itemId, swap }
 *        | { kind: 'extras' }
 *        | { kind: 'none', biggerStep }   biggerStep: a swap result or null
 */
export function pickFirstSwitch(results, extras) {
  const saving = allSwaps(results).filter((r) => r.paysBack)

  const easy = pickBestSwap(saving.filter((r) => r.effort === 'easy'))
  if (easy) return { kind: 'swap', itemId: easy.itemId, swap: easy }

  if (extras.totalAnnualSavings > 0) return { kind: 'extras' }

  const bigger = pickBestSwap(saving.filter((r) => r.effort !== 'easy'))
  return { kind: 'none', biggerStep: bigger ?? null }
}

/**
 * The checklist for the pick, as { key, vars } pairs (the words live in the
 * i18n files under "checklist."). The app setting line only appears for
 * businesses on DoorDash, Uber Eats, or similar.
 */
export function buildChecklist(pick, deliveryApps) {
  const appSetting = deliveryApps === 'yes' ? [{ key: 'checklist.appSetting' }] : []

  if (pick.kind === 'swap') {
    return [
      { key: 'checklist.buy', vars: { count: pick.swap.itemsNeeded, swapId: pick.swap.swapId } },
      { key: 'checklist.busTub' },
      { key: 'checklist.tellStaff' },
      ...appSetting,
    ]
  }
  if (pick.kind === 'extras') {
    return [{ key: 'checklist.stopExtras' }, { key: 'checklist.trainStaff' }, ...appSetting]
  }
  return []
}
