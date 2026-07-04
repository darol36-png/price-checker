import { describe, expect, it } from 'vitest'
import { comparePrices, formatPrice } from '../../site/src/lib/price-diff'

describe('comparePrices', () => {
  it('returns first_check when previous price is null', () => {
    expect(comparePrices(null, 100)).toBe('first_check')
  })

  it('returns up when price increased', () => {
    expect(comparePrices(100, 150)).toBe('up')
  })

  it('returns down when price decreased', () => {
    expect(comparePrices(200, 150)).toBe('down')
  })

  it('returns unchanged when price is the same', () => {
    expect(comparePrices(99.99, 99.99)).toBe('unchanged')
  })

  it('returns error when new price is null', () => {
    expect(comparePrices(100, null)).toBe('error')
  })
})

describe('formatPrice', () => {
  it('formats PLN price', () => {
    const formatted = formatPrice(1234.5, 'PLN')
    expect(formatted).toContain('1')
    expect(formatted).toMatch(/234|234,5|234,50/)
  })
})
