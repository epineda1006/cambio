// Tests for loadAssumptions.js: the real file loads, and mistakes are caught.

import { describe, expect, it } from 'vitest'
import { assumptions, parseAssumptionsCsv } from './loadAssumptions.js'

const HEADER = 'key,value,notes'
const GOOD = [
  'hand_wash_hourly_wage,16.90,PLACEHOLDER',
  'extras_request_share,0.30,x',
  'sauce_per_order,1,x',
  'sauce_unit_cost,0.04,x',
]
const csv = (rows) => [HEADER, ...rows].join('\n')

describe('the real assumptions.csv', () => {
  it('loads every number and is marked PLACEHOLDER', () => {
    expect(assumptions.handWashHourlyWage).toBeGreaterThan(0)
    expect(assumptions.extrasRequestShare).toBeGreaterThanOrEqual(0)
    expect(assumptions.extrasRequestShare).toBeLessThanOrEqual(1)
    expect(assumptions.isPlaceholder).toBe(true)
  })
})

describe('parseAssumptionsCsv', () => {
  it('turns rows into named numbers', () => {
    expect(parseAssumptionsCsv(csv(GOOD))).toEqual({
      handWashHourlyWage: 16.9,
      extrasRequestShare: 0.3,
      saucePerOrder: 1,
      sauceUnitCost: 0.04,
      isPlaceholder: true,
    })
  })

  it('names a missing row', () => {
    expect(() => parseAssumptionsCsv(csv(GOOD.slice(1)))).toThrow(/missing the "hand_wash_hourly_wage" row/)
  })

  it('names the row when a number is mistyped', () => {
    const rows = [...GOOD]
    rows[3] = 'sauce_unit_cost,O.04,x'
    expect(() => parseAssumptionsCsv(csv(rows))).toThrow(/row 5.*value/)
  })

  it('rejects unknown keys and shares above 100%', () => {
    expect(() => parseAssumptionsCsv(csv([...GOOD, 'fork_color,1,x']))).toThrow(/unknown key/)
    const rows = [...GOOD]
    rows[1] = 'extras_request_share,1.5,x'
    expect(() => parseAssumptionsCsv(csv(rows))).toThrow(/between 0 and 1/)
  })
})
