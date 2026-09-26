// Tests for results.js. Instead of hard-coding dollar amounts (which change
// whenever the PLACEHOLDER prices change), these check that buildResults()
// combines the tested calculator functions correctly.

import { describe, expect, it } from 'vitest'
import { evaluateSwap, pickBestSwap, poundsOfPlastic } from './calculator.js'
import { itemProfilesById } from './loadItems.js'
import { swapItems } from './loadSwaps.js'
import { buildResults } from './results.js'

const flow = { customersPerDay: '120', daysOpen: 6, dineInPct: 50, overrides: {} }

describe('buildResults', () => {
  const results = buildResults(flow)

  it('has one entry per item, in items.csv order', () => {
    expect(results.items.map((i) => i.itemId)).toEqual(Object.keys(itemProfilesById))
  })

  it("matches the calculator for each item's best swap", () => {
    const cups = results.items.find((i) => i.itemId === 'plastic_cups')
    const item = swapItems.find((i) => i.itemId === 'plastic_cups')
    const owner = { weeklyQty: cups.weeklyQty, dineInShare: 0.5, unitCost: item.unitCost, daysOpen: 6 }
    const expectedBest = pickBestSwap(item.swaps.map((s) => evaluateSwap(owner, s)))
    expect(cups.best.swapId).toBe(expectedBest.swapId)
    expect(cups.best.annualSavings).toBeCloseTo(expectedBest.annualSavings)
  })

  it('splits the best swap from the others', () => {
    for (const item of results.items) {
      expect(item.others).not.toContain(item.best)
      expect(item.others.length).toBe(item.results.length - 1)
    }
  })

  it('adds pounds of plastic from items.csv weights', () => {
    const forks = results.items.find((i) => i.itemId === 'plastic_forks')
    expect(forks.best.pounds).toBeCloseTo(
      poundsOfPlastic(forks.best.plasticAvoidedPerYear, itemProfilesById.plastic_forks.gramsEach),
    )
  })

  it('totals only best swaps that save money, and a monthly figure', () => {
    const counted = results.items.filter((i) => i.bestSavesMoney)
    const sum = counted.reduce((s, i) => s + i.best.annualSavings, 0)
    expect(results.totalAnnualSavings).toBeCloseTo(sum)
    expect(results.totalMonthlySavings).toBeCloseTo(sum / 12)
    expect(results.totalPounds).toBeCloseTo(counted.reduce((s, i) => s + i.best.pounds, 0))
  })

  it('reports the takeout share for the compostables note', () => {
    expect(results.takeoutPct).toBe(50)
    expect(buildResults({ ...flow, dineInPct: 20 }).takeoutPct).toBe(80)
  })

  it("uses the owner's own weekly number", () => {
    const r = buildResults({ ...flow, overrides: { plastic_cups: '0' } })
    const cups = r.items.find((i) => i.itemId === 'plastic_cups')
    expect(cups.weeklyQty).toBe(0)
    expect(cups.best).toBe(null) // nothing to swap
  })
})
