// Tests for flow.js: reading "customers a day" and checking Step 1 answers.

import { describe, expect, it } from 'vitest'
import { INITIAL_FLOW, parseCustomers, validateBusiness, validateWeekly, weeklyUsage } from './flow.js'
import { itemProfilesById } from './loadItems.js'

describe('parseCustomers', () => {
  it('reads plain and formatted whole numbers', () => {
    expect(parseCustomers('120')).toBe(120)
    expect(parseCustomers(' 120 ')).toBe(120)
    expect(parseCustomers('1,200')).toBe(1200)
  })

  it('returns null for anything that is not a whole number', () => {
    expect(parseCustomers('')).toBe(null)
    expect(parseCustomers('12.5')).toBe(null)
    expect(parseCustomers('-5')).toBe(null)
    expect(parseCustomers('about 100')).toBe(null)
  })
})

describe('validateBusiness', () => {
  const good = { customersPerDay: '120', daysOpen: 6, dineInPct: 50 }

  it('accepts a complete, sensible answer', () => {
    expect(validateBusiness(good)).toEqual([])
  })

  it('lists every missing answer, in screen order', () => {
    const keys = validateBusiness(INITIAL_FLOW).map((e) => e.key)
    expect(keys).toEqual(['errors.customersRequired', 'errors.daysRequired', 'errors.dineInRequired'])
  })

  it('points each error at the field to fix', () => {
    const fields = validateBusiness(INITIAL_FLOW).map((e) => e.field)
    expect(fields).toEqual(['customers', 'days-5', 'dinein-20'])
  })

  it('explains what is wrong with the customer number', () => {
    const keyFor = (customersPerDay) => validateBusiness({ ...good, customersPerDay })[0]?.key
    expect(keyFor('lots')).toBe('errors.customersInvalid')
    expect(keyFor('0')).toBe('errors.customersTooLow')
    expect(keyFor('5001')).toBe('errors.customersTooHigh')
    expect(keyFor('5000')).toBe(undefined) // the limit itself is fine
  })

  it('rejects answers that are not one of the choices', () => {
    expect(validateBusiness({ ...good, daysOpen: 4 })[0].key).toBe('errors.daysRequired')
    expect(validateBusiness({ ...good, dineInPct: 35 })[0].key).toBe('errors.dineInRequired')
  })
})

describe('validateWeekly', () => {
  it('accepts whole numbers, including 0', () => {
    expect(validateWeekly('400')).toBe(null)
    expect(validateWeekly('0')).toBe(null)
    expect(validateWeekly('1,200')).toBe(null)
  })

  it('rejects text and huge numbers', () => {
    expect(validateWeekly('lots').key).toBe('errors.weeklyInvalid')
    expect(validateWeekly('').key).toBe('errors.weeklyInvalid')
    expect(validateWeekly('100001').key).toBe('errors.weeklyTooHigh')
  })
})

describe('weeklyUsage', () => {
  const flow = { customersPerDay: '100', daysOpen: 6, overrides: {} }
  // Uses the real items.csv ratios, so compute the expected value from them.
  const expected = (itemId) => Math.round(100 * 6 * itemProfilesById[itemId].perCustomer)

  it('estimates every item from customers x days x ratio', () => {
    for (const row of weeklyUsage(flow)) {
      expect(row.estimate).toBe(expected(row.itemId))
      expect(row.weeklyQty).toBe(row.estimate)
      expect(row.isOverride).toBe(false)
    }
  })

  it("uses the owner's number where they typed one, and keeps the estimate for reference", () => {
    const rows = weeklyUsage({ ...flow, overrides: { plastic_cups: '400' } })
    const cups = rows.find((r) => r.itemId === 'plastic_cups')
    expect(cups).toMatchObject({ weeklyQty: 400, isOverride: true, estimate: expected('plastic_cups') })
    const forks = rows.find((r) => r.itemId === 'plastic_forks')
    expect(forks.isOverride).toBe(false)
  })

  it("keeps the owner's number when customers per day changes", () => {
    const rows = weeklyUsage({ ...flow, customersPerDay: '50', overrides: { plastic_cups: '400' } })
    expect(rows.find((r) => r.itemId === 'plastic_cups').weeklyQty).toBe(400)
    const forks = rows.find((r) => r.itemId === 'plastic_forks')
    expect(forks.weeklyQty).toBe(Math.round(50 * 6 * itemProfilesById.plastic_forks.perCustomer))
  })

  it('ignores an invalid typed number and falls back to the estimate', () => {
    const cups = weeklyUsage({ ...flow, overrides: { plastic_cups: 'abc' } })[0]
    expect(cups.isOverride).toBe(false)
  })
})
