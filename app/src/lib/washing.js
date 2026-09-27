// washing.js: the extra cost of washing reusables BY HAND.
//
// swaps.csv's wash_cost_per_use is the dishwasher cost (water, soap, energy,
// loading the rack). Washing by hand adds staff time: each swap has
// hand_wash_seconds (swaps.csv), and one hourly wage (assumptions.csv) turns
// those seconds into dollars. Using one source for both means "minutes a day"
// and "dollars a year" can never disagree.
//
// The calculator in calculator.js is NOT changed. Instead, withWashMethod()
// hands it a copy of the swap whose wash cost already includes the labor.
// Pure functions only, so each one is easy to test.

const SECONDS_PER_HOUR = 3600

/** Dollars of labor to hand-wash one item: seconds / 3600 x hourly wage. */
export function handWashCostPerUse(seconds, hourlyWage) {
  return (seconds / SECONDS_PER_HOUR) * hourlyWage
}

/**
 * The swap as the calculator should see it for this business.
 * 'hand': wash cost per use + hand-wash labor. Anything else: unchanged.
 * Returns a COPY ({ ...swap }), so the shared CSV data is never modified.
 */
export function withWashMethod(swap, washMethod, hourlyWage) {
  if (washMethod !== 'hand') return swap
  return {
    ...swap,
    washCostPerUse: swap.washCostPerUse + handWashCostPerUse(swap.handWashSeconds, hourlyWage),
  }
}

/**
 * Staff minutes per open day spent hand-washing one swap's items:
 *   items washed per week x seconds each / 60 / days open
 */
export function handWashMinutesPerDay(replacedPerWeek, seconds, daysOpen) {
  if (!(daysOpen >= 1)) return 0
  return (replacedPerWeek * seconds) / 60 / daysOpen
}
