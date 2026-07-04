import { useCallback, useState } from 'react'
import type { Product, PriceChangeSummary } from '../types/database'
import { checkAllProductPrices } from '../lib/price-checker'

export function usePriceCheck() {
  const [checking, setChecking] = useState(false)
  const [summary, setSummary] = useState<PriceChangeSummary | null>(null)

  const checkPrices = useCallback(async (products: Product[]) => {
    setChecking(true)
    try {
      const result = await checkAllProductPrices(products)
      setSummary(result)
      return result
    } finally {
      setChecking(false)
    }
  }, [])

  const clearSummary = useCallback(() => setSummary(null), [])

  return { checking, summary, checkPrices, clearSummary }
}
