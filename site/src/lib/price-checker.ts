import type { Product, PriceCheckResult, PriceChangeSummary } from '../types/database'
import { supabase } from './supabase-client'
import { fetchPageContent } from './fetch-page'
import { extractPrice } from './price-parser'
import { comparePrices } from './price-diff'

const CONCURRENCY = 1
const DELAY_BETWEEN_CHECKS_MS = 1500

async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = []
  let index = 0

  async function worker() {
    while (index < items.length) {
      const current = index++
      results[current] = await fn(items[current], current)
      if (current < items.length - 1 && DELAY_BETWEEN_CHECKS_MS > 0) {
        await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_CHECKS_MS))
      }
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker())
  await Promise.all(workers)
  return results
}

export async function checkProductPrice(product: Product): Promise<PriceCheckResult> {
  const base: PriceCheckResult = {
    productId: product.id,
    productName: product.name || product.url,
    url: product.url,
    status: 'error',
    previousPrice: product.current_price,
    newPrice: null,
    currency: product.currency,
  }

  try {
    const content = await fetchPageContent(product.url)
    const extracted = extractPrice(content)

    if (!extracted) {
      return { ...base, error: 'Nie znaleziono ceny na stronie' }
    }

    const status = comparePrices(product.current_price, extracted.price)

    const { error: updateError } = await supabase
      .from('products')
      .update({
        current_price: extracted.price,
        currency: extracted.currency,
        last_checked_at: new Date().toISOString(),
      })
      .eq('id', product.id)

    if (updateError) throw updateError

    const { error: historyError } = await supabase.from('price_history').insert({
      product_id: product.id,
      price: extracted.price,
      currency: extracted.currency,
    })

    if (historyError) throw historyError

    return {
      ...base,
      status,
      newPrice: extracted.price,
      currency: extracted.currency,
    }
  } catch (err) {
    return {
      ...base,
      error: err instanceof Error ? err.message : 'Nieznany błąd',
    }
  }
}

export function summarizePriceChanges(results: PriceCheckResult[]): PriceChangeSummary {
  const summary: PriceChangeSummary = {
    up: [],
    down: [],
    unchanged: [],
    firstCheck: [],
    errors: [],
  }

  for (const result of results) {
    switch (result.status) {
      case 'up':
        summary.up.push(result)
        break
      case 'down':
        summary.down.push(result)
        break
      case 'unchanged':
        summary.unchanged.push(result)
        break
      case 'first_check':
        summary.firstCheck.push(result)
        break
      default:
        summary.errors.push(result)
    }
  }

  return summary
}

export async function checkAllProductPrices(products: Product[]): Promise<PriceChangeSummary> {
  if (products.length === 0) {
    return { up: [], down: [], unchanged: [], firstCheck: [], errors: [] }
  }

  const results = await runWithConcurrency(products, CONCURRENCY, checkProductPrice)
  return summarizePriceChanges(results)
}
