import { describe, expect, it } from 'vitest'
import { summarizePriceChanges } from '../../site/src/lib/price-checker'
import type { PriceCheckResult } from '../../site/src/types/database'

function makeResult(overrides: Partial<PriceCheckResult>): PriceCheckResult {
  return {
    productId: '1',
    productName: 'Test',
    url: 'https://example.com',
    status: 'unchanged',
    previousPrice: 100,
    newPrice: 100,
    currency: 'PLN',
    ...overrides,
  }
}

describe('summarizePriceChanges', () => {
  it('groups results by status', () => {
    const results = [
      makeResult({ productId: '1', status: 'up' }),
      makeResult({ productId: '2', status: 'down' }),
      makeResult({ productId: '3', status: 'unchanged' }),
      makeResult({ productId: '4', status: 'first_check', previousPrice: null }),
      makeResult({ productId: '5', status: 'error', error: 'fail' }),
    ]

    const summary = summarizePriceChanges(results)

    expect(summary.up).toHaveLength(1)
    expect(summary.down).toHaveLength(1)
    expect(summary.unchanged).toHaveLength(1)
    expect(summary.firstCheck).toHaveLength(1)
    expect(summary.errors).toHaveLength(1)
  })
})
