// Tests for loadSwaps.js. They check that the real swaps.csv loads and that
// common editing mistakes are caught with a clear error.

import { describe, it, expect } from 'vitest'
import { parseSwapsCsv, swapItems } from './loadSwaps.js'

const HEADER =
  'item_id,unit_cost,swap_id,reusable_unit_price,par_multiplier,wash_cost_per_use,annual_loss_rate,notes'

describe('the real swaps.csv', () => {
  it('loads every item with at least one swap and valid numbers', () => {
    expect(swapItems.length).toBeGreaterThan(0)
    for (const item of swapItems) {
      expect(Number.isFinite(item.unitCost)).toBe(true)
      expect(item.swaps.length).toBeGreaterThan(0)
    }
  })
})

describe('parseSwapsCsv', () => {
  it('groups swaps under their item and converts numbers', () => {
    const items = parseSwapsCsv(
      `${HEADER}\ncups,0.10,a,2,1.5,0.03,0.2,PLACEHOLDER\ncups,0.10,b,1,1.5,0.03,0.3,real quote`,
    )
    expect(items).toHaveLength(1)
    expect(items[0].unitCost).toBe(0.1)
    expect(items[0].swaps.map((s) => s.swapId)).toEqual(['a', 'b'])
    expect(items[0].swaps[0].isPlaceholder).toBe(true)
    expect(items[0].swaps[1].isPlaceholder).toBe(false)
  })

  it('names the row when a number is mistyped', () => {
    expect(() => parseSwapsCsv(`${HEADER}\ncups,0.1O,a,2,1.5,0.03,0.2,x`)).toThrow(/row 2.*unit_cost/)
  })

  it('rejects two different prices for the same item', () => {
    expect(() =>
      parseSwapsCsv(`${HEADER}\ncups,0.10,a,2,1.5,0.03,0.2,x\ncups,0.12,b,2,1.5,0.03,0.2,x`),
    ).toThrow(/row 3.*differs/)
  })
})
