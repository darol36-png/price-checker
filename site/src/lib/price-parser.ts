export interface ExtractedPrice {
  price: number
  currency: string
}

function parseNumber(value: string): number | null {
  const normalized = value
    .replace(/\s/g, '')
    .replace(/\.(?=\d{3}(?:\D|$))/g, '')
    .replace(',', '.')
  const num = Number.parseFloat(normalized)
  return Number.isFinite(num) ? num : null
}

function extractFromJsonLd(content: string): ExtractedPrice | null {
  const scripts = content.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )

  for (const match of scripts) {
    try {
      const data = JSON.parse(match[1])
      const items = Array.isArray(data) ? data : [data]
      for (const item of items) {
        const result = findProductOffer(item)
        if (result) return result
      }
    } catch {
      // ignore invalid JSON-LD
    }
  }

  const jsonLdBlocks = content.matchAll(/```json\s*([\s\S]*?)```/gi)
  for (const match of jsonLdBlocks) {
    try {
      const data = JSON.parse(match[1])
      const items = Array.isArray(data) ? data : [data]
      for (const item of items) {
        const result = findProductOffer(item)
        if (result) return result
      }
    } catch {
      // ignore
    }
  }

  return null
}

function isSchemaType(value: unknown, typeName: string): boolean {
  if (value === typeName) return true
  if (Array.isArray(value)) return value.some((item) => isSchemaType(item, typeName))
  if (typeof value === 'string') {
    return value === typeName || value.endsWith(`/${typeName}`)
  }
  return false
}

function findProductOffer(node: unknown): ExtractedPrice | null {
  if (!node || typeof node !== 'object') return null
  const obj = node as Record<string, unknown>

  if (isSchemaType(obj['@type'], 'Product')) {
    const offers = obj.offers
    if (offers && typeof offers === 'object') {
      const offer = Array.isArray(offers) ? offers[0] : offers
      if (offer && typeof offer === 'object') {
        const price = (offer as Record<string, unknown>).price
        const currency = (offer as Record<string, unknown>).priceCurrency
        if (price != null) {
          const parsed = typeof price === 'number' ? price : parseNumber(String(price))
          if (parsed != null) {
            return { price: parsed, currency: String(currency || 'PLN') }
          }
        }
      }
    }
  }

  if (obj['@graph'] && Array.isArray(obj['@graph'])) {
    for (const child of obj['@graph']) {
      const result = findProductOffer(child)
      if (result) return result
    }
  }

  return null
}

function extractFromMeta(content: string): ExtractedPrice | null {
  const metaPatterns = [
    /(?:product:price:amount|og:price:amount|twitter:data1)\s*[:=]\s*["']?([\d.,]+)/i,
    /<meta[^>]+(?:property|name)=["'](?:product:price:amount|og:price:amount)["'][^>]+content=["']([\d.,]+)["']/i,
    /<meta[^>]+content=["']([\d.,]+)["'][^>]+(?:property|name)=["'](?:product:price:amount|og:price:amount)["']/i,
    /<meta[^>]+itemprop=["']price["'][^>]+content=["']([\d.,]+)["']/i,
    /<meta[^>]+content=["']([\d.,]+)["'][^>]+itemprop=["']price["']/i,
  ]

  for (const pattern of metaPatterns) {
    const match = content.match(pattern)
    if (match?.[1]) {
      const price = parseNumber(match[1])
      if (price != null) {
        const currencyMatch = content.match(
          /(?:product:price:currency|og:price:currency)\s*[:=]\s*["']?([A-Z]{3})/i,
        )
        return { price, currency: currencyMatch?.[1] || 'PLN' }
      }
    }
  }

  return null
}

const NOISE_LINE =
  /rata|raty|darmowa\s+dostaw|dostawa\s+od|rabat|taniej|market|firm\s+od|koszt|leasing|ratę|mies|rrso|kupon|coupon|subskrypc|google\s+ai|już\s+od\s+[\d,.]+\s*zł\/|0,00\s*zł|0\.00\s*zł/i

function isInstallmentPrice(price: number, allCandidates: number[]): boolean {
  if (allCandidates.length <= 1) return false
  const max = Math.max(...allCandidates)
  return max >= 1000 && price < 1000 && price < max / 5
}

function extractFromDataAttributes(content: string): ExtractedPrice | null {
  const prices: number[] = []

  const finalPricePattern =
    /data-price-amount=["'](\d+)["'][^>]*data-price-type=["']finalPrice["']|data-price-type=["']finalPrice["'][^>]*data-price-amount=["'](\d+)["']/gi

  for (const match of content.matchAll(finalPricePattern)) {
    const raw = match[1] || match[2]
    const price = parseNumber(raw)
    if (price != null && price > 0) prices.push(price)
  }

  if (prices.length === 0) {
    for (const match of content.matchAll(/data-price=["'](\d+)["']/gi)) {
      const price = parseNumber(match[1])
      if (price != null && price >= 100) prices.push(price)
    }
  }

  if (prices.length === 0) return null

  const mainPrices = prices.filter((price) => price >= 500)
  const pool = mainPrices.length > 0 ? mainPrices : prices

  return { price: Math.min(...pool), currency: 'PLN' }
}

function extractFromMagentoConfig(content: string): ExtractedPrice | null {
  const match = content.match(/initialFinalPrice:\s*(\d+)/i)
  if (!match?.[1]) return null

  const price = parseNumber(match[1])
  if (price == null || price <= 0) return null

  return { price, currency: 'PLN' }
}

function collectPlnCandidates(content: string): number[] {
  const candidates: number[] = []
  const plnPatterns = [
    /\*\*([\d][\d\s.,]*)\*\*\s*zł/gi,
    /([\d][\d\s]*[,.]\d{2})\s*(?:zł|PLN)/gi,
    /([\d]{1,3}(?:\s\d{3})+)\s*zł/gi,
    /([\d]{3,})\s*zł/gi,
  ]

  for (const line of content.split('\n')) {
    if (NOISE_LINE.test(line)) continue

    for (const pattern of plnPatterns) {
      for (const match of line.matchAll(pattern)) {
        const price = parseNumber(match[1])
        if (price != null && price >= 10) {
          candidates.push(price)
        }
      }
    }
  }

  return candidates
}

function pickBestCandidate(candidates: number[]): number | null {
  if (candidates.length === 0) return null

  const filtered = candidates.filter((price) => !isInstallmentPrice(price, candidates))
  const pool = filtered.length > 0 ? filtered : candidates

  const unique = [...new Set(pool)].sort((a, b) => a - b)
  if (unique.length === 1) return unique[0]

  const mainProductPrices = unique.filter((price) => price >= 1000)
  const midRangePrices = unique.filter((price) => price >= 500)
  const productPrices =
    mainProductPrices.length > 0
      ? mainProductPrices
      : midRangePrices.length > 0
        ? midRangePrices
        : unique.filter((price) => price >= 100)

  if (productPrices.length > 0) {
    return Math.min(...productPrices)
  }

  return Math.min(...unique)
}

function extractPromoPrice(content: string): ExtractedPrice | null {
  const promoPatterns = [
    /cena\s+promocyjna[:\s]+([\d][\d\s.,]*)\s*zł/i,
    /cena\s+regularna[:\s]+([\d][\d\s.,]*)\s*zł/i,
  ]

  for (const pattern of promoPatterns) {
    const match = content.match(pattern)
    if (match?.[1]) {
      const price = parseNumber(match[1])
      if (price != null && price > 0) {
        return { price, currency: 'PLN' }
      }
    }
  }

  return null
}

function extractForeignCurrency(content: string): ExtractedPrice | null {
  const foreignPatterns: Array<{ regex: RegExp; currency: string }> = [
    { regex: /€\s*([\d][\d\s.,]*)/i, currency: 'EUR' },
    { regex: /([\d][\d\s.,]*)\s*€/i, currency: 'EUR' },
    { regex: /\$\s*([\d][\d\s.,]*)/i, currency: 'USD' },
    { regex: /([\d][\d\s.,]*)\s*USD/i, currency: 'USD' },
  ]

  for (const line of content.split('\n')) {
    if (NOISE_LINE.test(line)) continue

    for (const { regex, currency } of foreignPatterns) {
      const match = line.match(regex)
      if (match?.[1]) {
        const price = parseNumber(match[1])
        if (price != null && price > 0) {
          return { price, currency }
        }
      }
    }
  }

  return null
}

function extractFromRegex(content: string): ExtractedPrice | null {
  const promo = extractPromoPrice(content)
  if (promo) return promo

  const candidates = collectPlnCandidates(content)
  const best = pickBestCandidate(candidates)
  if (best != null) {
    return { price: best, currency: 'PLN' }
  }

  const boldMatch = content.match(/\*\*([\d][\d\s.,]*)\*\*\s*zł/i)
  if (boldMatch?.[1]) {
    const price = parseNumber(boldMatch[1])
    if (price != null && price > 0) {
      return { price, currency: 'PLN' }
    }
  }

  return extractForeignCurrency(content)
}

export function extractPrice(content: string): ExtractedPrice | null {
  return (
    extractFromJsonLd(content) ??
    extractFromMeta(content) ??
    extractFromMagentoConfig(content) ??
    extractFromDataAttributes(content) ??
    extractFromRegex(content)
  )
}
