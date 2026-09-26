// Unit tests for calculator.js, run with `npm test`.
//
// A unit test calls a function with known inputs and checks the output
// against an answer we worked out BY HAND. If someone later changes the math
// by accident, a test fails and tells us exactly which number changed.
//
// Vitest vocabulary:
//   describe(...)  groups related tests
//   it(...)        one test: "it should do X"
//   expect(a).toBe(b)          a must equal b exactly
//   expect(a).toBeCloseTo(b)   a must equal b to 2 decimal places (for money,
//                              because computers store 0.03 slightly inexactly)
//
// These inputs are made-up test numbers, not real prices.

import { describe, it, expect } from 'vitest'
import { annualDisposableCost, evaluateSwap, pickBestSwap, summarize } from './calculator.js'

// A cafe using 700 cups a week, half of them for dine-in, open every day.
const cupsOwner = { weeklyQty: 700, dineInShare: 0.5, unitCost: 0.1, daysOpen: 7 }
const tumbler = {
  swapId: 'tumbler',
  reusableUnitPrice: 2.0,
  parMultiplier: 1.5,
  washCostPerUse: 0.03,
  annualLossRate: 0.2,
}

describe('annualDisposableCost', () => {
  it('is weekly qty x unit cost x 52', () => {
    // 700 x $0.10 x 52 = $3,640
    expect(annualDisposableCost(cupsOwner)).toBeCloseTo(3640)
  })
})

describe('evaluateSwap: a swap that saves money', () => {
  const r = evaluateSwap(cupsOwner, tumbler)

  it('replaces only dine-in items', () => {
    expect(r.replacedPerWeek).toBe(350) // 700 x 0.5
  })

  it('buys one day of use times par, rounded up', () => {
    expect(r.itemsNeeded).toBe(75) // ceil(350 / 7 x 1.5) = ceil(75)
    expect(r.upfrontCost).toBeCloseTo(150) // 75 x $2.00
  })

  it('adds washing and replacement into ongoing cost', () => {
    expect(r.annualWashCost).toBeCloseTo(546) // 0.03 x 350 x 52
    expect(r.annualReplacementCost).toBeCloseTo(30) // 75 x 0.2 x $2.00
    expect(r.annualOngoingCost).toBeCloseTo(576)
  })

  it('computes savings, payback, and plastic avoided', () => {
    expect(r.annualDisposablesAvoided).toBeCloseTo(1820) // 350 x $0.10 x 52
    expect(r.annualSavings).toBeCloseTo(1244) // 1820 - 576
    expect(r.paysBack).toBe(true)
    expect(r.paybackWeeks).toBeCloseTo(6.27) // 150 / (1244 / 52)
    expect(r.plasticAvoidedPerYear).toBe(18200) // 350 x 52
  })
})

describe('evaluateSwap: days open', () => {
  it('needs more reusables when open fewer days (same weekly volume)', () => {
    const r = evaluateSwap({ ...cupsOwner, daysOpen: 5 }, tumbler)
    expect(r.itemsNeeded).toBe(105) // ceil(350 / 5 x 1.5)
    expect(r.upfrontCost).toBeCloseTo(210)
  })

  it('rejects impossible days open instead of dividing by zero', () => {
    expect(() => evaluateSwap({ ...cupsOwner, daysOpen: 0 }, tumbler)).toThrow(RangeError)
  })
})

describe('evaluateSwap: honest results when a swap does not pay', () => {
  // Plastic forks are so cheap that washing metal forks costs more.
  const forksOwner = { weeklyQty: 700, dineInShare: 0.5, unitCost: 0.02, daysOpen: 7 }
  const metalFork = {
    swapId: 'metal_fork',
    reusableUnitPrice: 1.5,
    parMultiplier: 1.5,
    washCostPerUse: 0.05,
    annualLossRate: 0.1,
  }

  it('reports negative savings and never pays back', () => {
    const r = evaluateSwap(forksOwner, metalFork)
    // avoided 350 x 0.02 x 52 = 364
    // ongoing 0.05 x 350 x 52 + 75 x 0.1 x 1.5 = 910 + 11.25 = 921.25
    expect(r.annualSavings).toBeCloseTo(-557.25)
    expect(r.paysBack).toBe(false)
    expect(r.paybackWeeks).toBe(null)
  })

  it('handles 0% dine-in: nothing replaced, nothing saved', () => {
    const r = evaluateSwap({ ...cupsOwner, dineInShare: 0 }, tumbler)
    expect(r.itemsNeeded).toBe(0)
    expect(r.annualSavings).toBe(0)
    expect(r.paysBack).toBe(false)
    expect(r.paybackWeeks).toBe(null)
  })
})

describe('pickBestSwap', () => {
  it('picks the highest yearly savings', () => {
    const a = { swapId: 'a', annualSavings: 100, paybackWeeks: 5 }
    const b = { swapId: 'b', annualSavings: 200, paybackWeeks: 9 }
    expect(pickBestSwap([a, b]).swapId).toBe('b')
  })

  it('breaks a tie with the shorter payback', () => {
    const a = { swapId: 'a', annualSavings: 100, paybackWeeks: 10 }
    const b = { swapId: 'b', annualSavings: 100, paybackWeeks: 5 }
    expect(pickBestSwap([a, b]).swapId).toBe('b')
  })

  it('returns null for no swaps', () => {
    expect(pickBestSwap([])).toBe(null)
  })
})

describe('summarize', () => {
  const winning = { replacedPerWeek: 350, annualSavings: 1244, paysBack: true, paybackWeeks: 6.27, plasticAvoidedPerYear: 18200, upfrontCost: 150 }
  const losing = { replacedPerWeek: 350, annualSavings: -557.25, paysBack: false, paybackWeeks: null, plasticAvoidedPerYear: 18200, upfrontCost: 112.5 }
  const unused = { replacedPerWeek: 0, annualSavings: 0, paysBack: false, paybackWeeks: null, plasticAvoidedPerYear: 0, upfrontCost: 0 }

  it('counts only best swaps that save money, and reports the rest', () => {
    const s = summarize([
      { itemId: 'cups', swaps: [winning] },
      { itemId: 'forks', swaps: [losing] }, // adds $0 and 0 plastic
      { itemId: 'clamshells', swaps: [unused] }, // not used on site: in neither count
    ])
    expect(s.totalAnnualSavings).toBeCloseTo(1244)
    expect(s.totalPlasticAvoided).toBe(18200) // the losing swap's plastic is NOT counted
    expect(s.totalUpfrontCost).toBeCloseTo(150)
    expect(s.itemsWithSavingSwap).toBe(1)
    expect(s.itemsWithoutSavingSwap).toBe(1)
  })
})
