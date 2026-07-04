import type { PriceChangeStatus } from '../types/database'

export function comparePrices(
  previousPrice: number | null,
  newPrice: number | null,
): PriceChangeStatus {
  if (newPrice == null) return 'error'
  if (previousPrice == null) return 'first_check'
  if (newPrice > previousPrice) return 'up'
  if (newPrice < previousPrice) return 'down'
  return 'unchanged'
}

export function formatPrice(price: number, currency: string): string {
  try {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(price)
  } catch {
    return `${price.toFixed(2)} ${currency}`
  }
}
