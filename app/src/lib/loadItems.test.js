// Tests for loadItems.js: the real items.csv loads, it matches swaps.csv,
// and common editing mistakes are caught with a clear error.

import { describe, expect, it } from 'vitest'
import { itemProfiles, parseItemsCsv } from './loadItems.js'
import { swapItems } from './loadSwaps.js'

const HEADER = 'item_id,per_customer,grams_each,notes'

describe('the real items.csv', () => {
  it('lists exactly the same items as swaps.csv', () => {
    const itemIds = itemProfiles.map((p) => p.itemId).sort()
    const swapItemIds = swapItems.map((i) => i.itemId).sort()
    expect(itemIds).toEqual(swapItemIds)
  })

  it('has a positive ratio and weight for every item', () => {
    for (const p of itemProfiles) {
      expect(p.perCustomer).toBeGreaterThan(0)
      expect(p.gramsEach).toBeGreaterThan(0)
    }
  })
})

describe('parseItemsCsv', () => {
  it('converts numbers and flags placeholders', () => {
    const [cups, forks] = parseItemsCsv(`${HEADER}\ncups,0.8,12,PLACEHOLDER\nforks,0.6,5,weighed`)
    expect(cups).toMatchObject({ itemId: 'cups', perCustomer: 0.8, gramsEach: 12, isPlaceholder: true })
    expect(forks.isPlaceholder).toBe(false)
  })

  it('names the row when a number is mistyped', () => {
    expect(() => parseItemsCsv(`${HEADER}\ncups,O.8,12,x`)).toThrow(/items.csv row 2.*per_customer/)
  })

  it('rejects the same item twice', () => {
    expect(() => parseItemsCsv(`${HEADER}\ncups,0.8,12,x\ncups,0.5,12,x`)).toThrow(/row 3.*twice/)
  })

  it('rejects negative values', () => {
    expect(() => parseItemsCsv(`${HEADER}\ncups,-1,12,x`)).toThrow(/negative/)
  })
})
