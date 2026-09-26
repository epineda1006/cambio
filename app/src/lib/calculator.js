// calculator.js: the Cambio savings math, kept separate from the UI.
//
// Every function here is a PURE FUNCTION: it only uses its inputs, it does not
// read the screen, the CSV, or anything else, and it always returns the same
// output for the same input. That makes the math easy to test (see
// calculator.test.js) and easy to explain to judges, because nothing
// outside the function can change the answer.
//
// The formulas follow README.md "Calculator math". The two additions (how
// many reusables are needed and how ongoing cost is built) are recorded in
// docs/decisions.md (2026-09-26).
//
// Units: money is in US dollars, quantities are item counts, and
// dineInShare is a fraction from 0 to 1 (0.5 means 50% of orders eaten on site).

const WEEKS_PER_YEAR = 52

// Math.ceil on a computer can be fooled by tiny floating-point errors, e.g.
// 0.1 * 3 is 0.30000000000000004, so Math.ceil(... * 10) would give 4 instead
// of 3. Rounding to 9 decimal places first removes that noise.
function safeCeil(value) {
  return Math.ceil(Number(value.toFixed(9)))
}

// Stop early with a clear message if an input is impossible (for example,
// 0 days open would mean dividing by zero). The UI keeps inputs in range,
// so this only catches programming mistakes.
function checkInputs({ weeklyQty, dineInShare, daysOpen }) {
  if (!(weeklyQty >= 0)) throw new RangeError('weeklyQty must be 0 or more')
  if (!(dineInShare >= 0 && dineInShare <= 1)) {
    throw new RangeError('dineInShare must be between 0 and 1')
  }
  if (!(daysOpen >= 1 && daysOpen <= 7)) {
    throw new RangeError('daysOpen must be between 1 and 7')
  }
}

/**
 * What the owner spends on one disposable item per year today.
 * README: annual_disposable_cost = weekly_qty x unit_cost x 52
 */
export function annualDisposableCost({ weeklyQty, unitCost }) {
  return weeklyQty * unitCost * WEEKS_PER_YEAR
}

/**
 * Run one swap for one item.
 *
 * @param {object} owner  What the owner told us about this item:
 *   weeklyQty, dineInShare (0 to 1), unitCost (price of one disposable),
 *   daysOpen (1 to 7, a restaurant-level setting).
 * @param {object} swap   One row from swaps.csv:
 *   swapId, reusableUnitPrice, parMultiplier, washCostPerUse, annualLossRate.
 * @returns {object} every intermediate number, so the UI can show its work.
 */
export function evaluateSwap(owner, swap) {
  checkInputs(owner)
  const { weeklyQty, dineInShare, unitCost, daysOpen } = owner
  const { reusableUnitPrice, parMultiplier, washCostPerUse, annualLossRate } = swap

  // README: replaced_per_week = weekly_qty x dine_in_share
  // Reuse only works for dine-in orders; takeout still needs disposables.
  const replacedPerWeek = weeklyQty * dineInShare

  // decisions.md: items_needed = ceil(replaced_per_week / days_open x par)
  // One day's use times the par multiplier (spares for items in the wash).
  // We round UP because you can't buy half a basket.
  const itemsNeeded =
    replacedPerWeek > 0 ? safeCeil((replacedPerWeek / daysOpen) * parMultiplier) : 0

  // README: upfront_cost = reusable items needed x reusable unit price
  const upfrontCost = itemsNeeded * reusableUnitPrice

  // decisions.md: annual_ongoing_cost = washing + replacing lost/broken items
  const annualWashCost = washCostPerUse * replacedPerWeek * WEEKS_PER_YEAR
  const annualReplacementCost = itemsNeeded * annualLossRate * reusableUnitPrice
  const annualOngoingCost = annualWashCost + annualReplacementCost

  // README: annual_savings = (replaced_per_week x unit_cost x 52) - annual_ongoing_cost
  const annualDisposablesAvoided = replacedPerWeek * unitCost * WEEKS_PER_YEAR
  const annualSavings = annualDisposablesAvoided - annualOngoingCost

  // README: payback_weeks = upfront_cost / (annual_savings / 52)
  // If the swap saves nothing (or loses money), it NEVER pays back. Dividing
  // anyway would give a meaningless or negative number, so we return null
  // and paysBack: false. The UI then says so honestly instead of hiding it.
  const paysBack = annualSavings > 0
  const paybackWeeks = paysBack ? upfrontCost / (annualSavings / WEEKS_PER_YEAR) : null

  // README: plastic_avoided_per_year = replaced_per_week x 52
  const plasticAvoidedPerYear = replacedPerWeek * WEEKS_PER_YEAR

  return {
    swapId: swap.swapId,
    replacedPerWeek,
    itemsNeeded,
    upfrontCost,
    annualWashCost,
    annualReplacementCost,
    annualOngoingCost,
    annualDisposablesAvoided,
    annualSavings,
    paysBack,
    paybackWeeks,
    plasticAvoidedPerYear,
  }
}

/**
 * Pick the best swap for one item from a list of evaluateSwap results.
 * Highest yearly savings wins; on a tie, the shorter payback wins.
 * Returns null if the list is empty.
 */
export function pickBestSwap(results) {
  if (!results || results.length === 0) return null
  // [...results] copies the array so sort() doesn't reorder the caller's list.
  return [...results].sort((a, b) => {
    if (b.annualSavings !== a.annualSavings) return b.annualSavings - a.annualSavings
    // A null payback (never pays back) counts as "infinitely long".
    const pa = a.paybackWeeks ?? Infinity
    const pb = b.paybackWeeks ?? Infinity
    return pa - pb
  })[0]
}

/**
 * Totals for the summary card at the top of the Owner tool: the headline
 * number for the pitch video, so it must never overstate savings.
 *
 * @param {Array} itemResults  [{ itemId, swaps: [evaluateSwap results] }, ...]
 * @returns {object}
 *   totalAnnualSavings, totalPlasticAvoided, totalUpfrontCost: summed over
 *     the best swap of each item that actually saves money.
 *   itemsWithSavingSwap: how many items were counted.
 *   itemsWithoutSavingSwap: items the owner uses on site where even the
 *     best swap does not save money; they add $0 and are reported honestly.
 *   Items with nothing to replace (0 per week or 0% dine-in) are in neither count.
 */
export function summarize(itemResults) {
  const summary = {
    totalAnnualSavings: 0,
    totalPlasticAvoided: 0,
    totalUpfrontCost: 0,
    itemsWithSavingSwap: 0,
    itemsWithoutSavingSwap: 0,
  }

  for (const item of itemResults) {
    const best = pickBestSwap(item.swaps)
    if (!best || best.replacedPerWeek === 0) continue

    if (best.paysBack) {
      summary.totalAnnualSavings += best.annualSavings
      summary.totalPlasticAvoided += best.plasticAvoidedPerYear
      summary.totalUpfrontCost += best.upfrontCost
      summary.itemsWithSavingSwap += 1
    } else {
      summary.itemsWithoutSavingSwap += 1
    }
  }

  return summary
}
