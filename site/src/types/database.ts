export interface Product {
  id: string
  user_id: string
  name: string
  url: string
  current_price: number | null
  currency: string
  last_checked_at: string | null
  created_at: string
  updated_at: string
}

export interface PriceHistory {
  id: string
  product_id: string
  price: number
  currency: string
  checked_at: string
}

export type PriceChangeStatus = 'up' | 'down' | 'unchanged' | 'first_check' | 'error'

export interface PriceCheckResult {
  productId: string
  productName: string
  url: string
  status: PriceChangeStatus
  previousPrice: number | null
  newPrice: number | null
  currency: string
  error?: string
}

export interface PriceChangeSummary {
  up: PriceCheckResult[]
  down: PriceCheckResult[]
  unchanged: PriceCheckResult[]
  firstCheck: PriceCheckResult[]
  errors: PriceCheckResult[]
}
