// takeout.js: savings from giving takeout "extras" (forks and sauce) only
// when a customer asks, instead of putting them in every bag.
//
// Order of priorities for takeout (see docs/decisions.md): REDUCE first
// (don't hand out what nobody wanted), then reuse, then better materials.
//
// No double counting: takeout forks come from the SAME weekly fork number as
// Step 2 (our estimate, or the owner's own number), split by the takeout
// share. Dine-in forks belong to the reusable-fork swap; takeout forks here.
//
// Pure function: flow + data in, numbers out.

import { parseCustomers, weeklyUsage } from './flow.js'
import { REAL_DATA } from './results.js'

const WEEKS_PER_YEAR = 52
export const FORK_ITEM_ID = 'plastic_forks'

/**
 * @param flow  the flow state: dineInPct, customersPerDay, daysOpen,
 *              overrides, extrasAuto ('yes' = in every bag, 'ifAsked')
 * @param data  { swapItems, itemProfiles, assumptions } (defaults to real data)
 * @returns {
 *   automatic,      true if extras currently go in every bag
 *   takeoutShare,   0 to 1
 *   extras: [{ id: 'forks' | 'sauce', weeklyQty, unitCost, annualSavings }],
 *   totalAnnualSavings
 * }
 * Savings per extra = takeout qty x (1 - request share) x unit cost x 52,
 * and 0 when the business already gives extras only on request.
 */
export function takeoutExtras(flow, data = REAL_DATA) {
  const { extrasRequestShare, saucePerOrder, sauceUnitCost } = data.assumptions
  const takeoutShare = 1 - (flow.dineInPct ?? 100) / 100
  const automatic = flow.extrasAuto === 'yes'

  // Forks: Step 2's weekly number (estimate or the owner's), takeout part only.
  const forkRow = weeklyUsage(flow, data.itemProfiles).find((r) => r.itemId === FORK_ITEM_ID)
  const forkItem = data.swapItems.find((i) => i.itemId === FORK_ITEM_ID)
  const weeklyForks = forkRow ? forkRow.weeklyQty * takeoutShare : 0

  // Sauce: one order per customer (see the open question in decisions.md).
  const ordersPerWeek = (parseCustomers(flow.customersPerDay) ?? 0) * (flow.daysOpen ?? 0)
  const weeklySauce = ordersPerWeek * takeoutShare * saucePerOrder

  // How much of one extra we'd stop handing out, in dollars per year.
  const savingsFor = (weeklyQty, unitCost) =>
    automatic ? weeklyQty * (1 - extrasRequestShare) * unitCost * WEEKS_PER_YEAR : 0

  const extras = [
    { id: 'forks', weeklyQty: weeklyForks, unitCost: forkItem?.unitCost ?? 0 },
    { id: 'sauce', weeklyQty: weeklySauce, unitCost: sauceUnitCost },
  ].map((e) => ({ ...e, annualSavings: savingsFor(e.weeklyQty, e.unitCost) }))

  return {
    automatic,
    takeoutShare,
    extras,
    totalAnnualSavings: extras.reduce((sum, e) => sum + e.annualSavings, 0),
  }
}
