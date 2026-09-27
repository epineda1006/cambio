// Tests for the Step 4 math: hand-wash labor (washing.js), takeout extras
// (takeout.js), and the first-switch pick + checklist (firstSwitch.js).
//
// Small made-up data sets ("fixtures") make each situation happen on
// purpose, e.g. a swap that saves money with a dishwasher but not by hand.

import { describe, expect, it } from 'vitest'
import { buildChecklist, pickFirstSwitch } from './firstSwitch.js'
import { itemProfiles } from './loadItems.js'
import { swapItems } from './loadSwaps.js'
import { buildResults } from './results.js'
import { takeoutExtras } from './takeout.js'
import { handWashCostPerUse, handWashMinutesPerDay, withWashMethod } from './washing.js'

const ASSUMPTIONS = {
  handWashHourlyWage: 16.9,
  extrasRequestShare: 0.3,
  saucePerOrder: 1,
  sauceUnitCost: 0.04,
}

// A swap row with sensible defaults; override only what a test needs.
const swap = (fields) => ({
  reusableUnitPrice: 1.25,
  parMultiplier: 1.5,
  washCostPerUse: 0.03,
  annualLossRate: 0.3,
  handWashSeconds: 10,
  ...fields,
})

// Cups + forks with the given swaps, and simple per-customer ratios.
function makeData(cupSwaps, forkSwaps) {
  return {
    swapItems: [
      { itemId: 'plastic_cups', unitCost: 0.1, swaps: cupSwaps },
      { itemId: 'plastic_forks', unitCost: 0.02, swaps: forkSwaps },
    ],
    itemProfiles: [
      { itemId: 'plastic_cups', perCustomer: 0.8, gramsEach: 12 },
      { itemId: 'plastic_forks', perCustomer: 0.6, gramsEach: 5 },
    ],
    assumptions: ASSUMPTIONS,
  }
}

const flow = {
  customersPerDay: '120',
  daysOpen: 6,
  dineInPct: 50,
  overrides: {},
  washMethod: 'dishwasher',
  extrasAuto: 'yes',
  deliveryApps: 'no',
}

// ---------------------------------------------------------------------------
describe('hand-wash labor (washing.js)', () => {
  it('turns seconds into dollars with the hourly wage', () => {
    expect(handWashCostPerUse(36, 20)).toBeCloseTo(0.2) // 36 s = 1% of an hour
  })

  it('adds labor to the wash cost only for hand washing, without changing the original', () => {
    const s = swap({ swapId: 'glass_cup', washCostPerUse: 0.03, handWashSeconds: 36 })
    expect(withWashMethod(s, 'dishwasher', 20)).toBe(s)
    expect(withWashMethod(s, 'hand', 20).washCostPerUse).toBeCloseTo(0.23)
    expect(s.washCostPerUse).toBe(0.03) // the shared data is untouched
  })

  it('works out minutes a day', () => {
    // 700 items a week x 12 s = 8,400 s = 140 min a week, over 7 days = 20
    expect(handWashMinutesPerDay(700, 12, 7)).toBeCloseTo(20)
  })

  it('lowers Step 3 savings for hand washing by exactly the labor cost', () => {
    const real = { swapItems, itemProfiles, assumptions: ASSUMPTIONS }
    const glass = (r) => r.items[0].results.find((x) => x.swapId === 'glass_cup')
    const machine = glass(buildResults(flow, real))
    const hand = glass(buildResults({ ...flow, washMethod: 'hand' }, real))
    const labor = handWashCostPerUse(10, 16.9) * machine.replacedPerWeek * 52
    expect(machine.annualSavings - hand.annualSavings).toBeCloseTo(labor)
    expect(machine.handWashMinutesPerDay).toBe(0)
    expect(hand.handWashMinutesPerDay).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
describe('takeout extras (takeout.js)', () => {
  const real = { swapItems, itemProfiles, assumptions: ASSUMPTIONS }
  const base = { ...flow, customersPerDay: '100', daysOpen: 5, dineInPct: 50 }

  it('saves by giving extras only on request (hand-worked numbers)', () => {
    const t = takeoutExtras(base, real)
    const [forks, sauce] = t.extras
    // Forks: 100 x 5 x 0.6 = 300 a week (Step 2), half takeout = 150.
    // 150 x (1 - 0.3) x $0.02 x 52 = $109.20
    expect(forks.weeklyQty).toBe(150)
    expect(forks.annualSavings).toBeCloseTo(109.2)
    // Sauce: 500 orders x half takeout x 1 = 250; 250 x 0.7 x $0.04 x 52 = $364
    expect(sauce.weeklyQty).toBe(250)
    expect(sauce.annualSavings).toBeCloseTo(364)
    expect(t.totalAnnualSavings).toBeCloseTo(473.2)
  })

  it('reuses Step 2 forks, including the owner\'s own number (no double counting)', () => {
    const t = takeoutExtras({ ...base, overrides: { plastic_forks: '1000' } }, real)
    expect(t.extras[0].weeklyQty).toBe(500) // 1,000 a week x half takeout
  })

  it('shows no extras savings when they already give extras only if asked', () => {
    const t = takeoutExtras({ ...base, extrasAuto: 'ifAsked' }, real)
    expect(t.automatic).toBe(false)
    expect(t.totalAnnualSavings).toBe(0)
    for (const e of t.extras) expect(e.annualSavings).toBe(0)
  })

  it('has nothing to save with a takeout share of zero', () => {
    const t = takeoutExtras({ ...base, dineInPct: 100 }, real)
    expect(t.takeoutShare).toBe(0)
    for (const e of t.extras) expect(e.weeklyQty).toBe(0)
    expect(t.totalAnnualSavings).toBe(0)
  })
})

// ---------------------------------------------------------------------------
describe('the first-switch pick (firstSwitch.js)', () => {
  const pick = (f, data) => pickFirstSwitch(buildResults(f, data), takeoutExtras(f, data))

  it('picks the easy swap with the highest yearly savings', () => {
    const real = { swapItems, itemProfiles, assumptions: ASSUMPTIONS }
    const results = buildResults(flow, real)
    const easySaving = results.items
      .flatMap((i) => i.results)
      .filter((r) => r.effort === 'easy' && r.paysBack)
    const top = Math.max(...easySaving.map((r) => r.annualSavings))
    const p = pickFirstSwitch(results, takeoutExtras(flow, real))
    expect(p.kind).toBe('swap')
    expect(p.swap.annualSavings).toBe(top)
  })

  it('prefers an easy swap even when a harder one saves more', () => {
    const data = makeData(
      [
        swap({ swapId: 'glass_cup', effort: 'easy', washCostPerUse: 0.06 }),
        swap({ swapId: 'reusable_tumbler', effort: 'medium', washCostPerUse: 0.01 }),
      ],
      [],
    )
    const p = pick(flow, data)
    expect(p.kind).toBe('swap')
    expect(p.swap.swapId).toBe('glass_cup')
  })

  it('switches to takeout extras when hand washing makes the easy swaps lose money', () => {
    // 30 s of hand washing at $16.90/h = $0.14 per cup: more than a $0.10 cup.
    const data = makeData(
      [swap({ swapId: 'glass_cup', effort: 'easy', handWashSeconds: 30 })],
      [swap({ swapId: 'metal_fork', effort: 'easy', washCostPerUse: 0.002, handWashSeconds: 30 })],
    )
    expect(pick(flow, data).kind).toBe('swap') // dishwasher: the cups save money
    expect(pick({ ...flow, washMethod: 'hand' }, data).kind).toBe('extras')
  })

  it('offers a bigger step only when a medium or hard swap saves money', () => {
    const losingEasy = swap({ swapId: 'glass_cup', effort: 'easy', washCostPerUse: 0.2 })
    const savingMedium = swap({ swapId: 'reusable_tumbler', effort: 'medium', washCostPerUse: 0.01 })
    const losingMedium = swap({ swapId: 'reusable_tumbler', effort: 'medium', washCostPerUse: 0.2 })
    const onRequest = { ...flow, extrasAuto: 'ifAsked' }

    const withBigger = pick(onRequest, makeData([losingEasy, savingMedium], []))
    expect(withBigger.kind).toBe('none')
    expect(withBigger.biggerStep.swapId).toBe('reusable_tumbler')

    const without = pick(onRequest, makeData([losingEasy, losingMedium], []))
    expect(without).toEqual({ kind: 'none', biggerStep: null })
  })
})

// ---------------------------------------------------------------------------
describe('buildChecklist', () => {
  const swapPick = { kind: 'swap', itemId: 'plastic_cups', swap: { swapId: 'glass_cup', itemsNeeded: 44 } }
  const keys = (list) => list.map((x) => x.key)

  it('lists buy / bus tub / tell staff for a swap, with real quantities', () => {
    const list = buildChecklist(swapPick, 'no')
    expect(keys(list)).toEqual(['checklist.buy', 'checklist.busTub', 'checklist.tellStaff'])
    expect(list[0].vars).toEqual({ count: 44, swapId: 'glass_cup' })
  })

  it('adds the delivery-app setting for a swap when they use apps', () => {
    expect(keys(buildChecklist(swapPick, 'yes')).at(-1)).toBe('checklist.appSetting')
  })

  it('lists stop extras / train staff for the extras pick, plus the app setting if needed', () => {
    expect(keys(buildChecklist({ kind: 'extras' }, 'no'))).toEqual([
      'checklist.stopExtras',
      'checklist.trainStaff',
    ])
    expect(keys(buildChecklist({ kind: 'extras' }, 'yes'))).toEqual([
      'checklist.stopExtras',
      'checklist.trainStaff',
      'checklist.appSetting',
    ])
  })

  it('has no checklist when there is nothing to switch', () => {
    expect(buildChecklist({ kind: 'none', biggerStep: null }, 'yes')).toEqual([])
  })
})
