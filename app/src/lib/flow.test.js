// Tests for flow.js: reading "customers a day" and checking Step 1 answers.

import { describe, expect, it } from 'vitest'
import { INITIAL_FLOW, parseCustomers, validateBusiness } from './flow.js'

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
