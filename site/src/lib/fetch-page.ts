import { isBlockedPage } from './bot-page'
import { normalizeProductUrl } from './product-url'

export function fetchErrorMessage(status: number): string {
  if (status === 429) {
    return 'Przekroczono limit zapytań — spróbuj ponownie za chwilę'
  }
  return `Nie udało się pobrać strony (${status})`
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

interface JinaReaderResponse {
  data?: {
    content?: string
    title?: string
    warning?: string
  }
  content?: string
  warning?: string
  error?: string
  message?: string
}

function extractJinaContent(payload: JinaReaderResponse, rawText: string): string {
  if (payload.data?.content) return payload.data.content
  if (payload.content) return payload.content
  return rawText
}

function isIspotUrl(url: string): boolean {
  try {
    return new URL(url).hostname.replace(/^www\./, '') === 'ispot.pl'
  } catch {
    return false
  }
}

function toIspotProxyPath(url: string): string {
  const parsed = new URL(url)
  return `/api/ispot${parsed.pathname}${parsed.search}`
}

async function fetchWithRetries(path: string, init?: RequestInit): Promise<string> {
  const maxAttempts = 3

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(path, init)

    if (response.ok) {
      return response.text()
    }

    if (response.status === 429 && attempt < maxAttempts - 1) {
      const retryAfterSec = Number(response.headers.get('Retry-After')) || (attempt + 1) * 2
      await sleep(retryAfterSec * 1000)
      continue
    }

    throw new Error(fetchErrorMessage(response.status))
  }

  throw new Error(fetchErrorMessage(429))
}

async function fetchIspotPage(url: string): Promise<string> {
  const content = await fetchWithRetries(toIspotProxyPath(url), {
    headers: { Accept: 'text/html, application/xhtml+xml, */*' },
  })

  if (isBlockedPage(content)) {
    throw new Error(
      'Sklep iSpot blokuje automatyczne pobieranie strony. Spróbuj ponownie później.',
    )
  }

  return content
}

async function fetchViaJinaGet(url: string): Promise<string> {
  const encoded = encodeURIComponent(url)
  const content = await fetchWithRetries(`/api/fetch/${encoded}`, {
    headers: { Accept: 'text/html, text/plain, */*' },
  })

  if (isBlockedPage(content)) {
    throw new Error('blocked')
  }

  return content
}

async function fetchViaJinaPost(url: string): Promise<string> {
  const maxAttempts = 3

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch('/api/jina-reader', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/plain, */*',
      },
      body: JSON.stringify({
        url,
        engine: 'browser',
        proxy: 'auto',
        timeout: 60,
      }),
    })

    if (response.ok) {
      const rawText = await response.text()
      let content = rawText

      try {
        const payload = JSON.parse(rawText) as JinaReaderResponse
        content = extractJinaContent(payload, rawText)
      } catch {
        // plain text/markdown response
      }

      if (isBlockedPage(content)) {
        throw new Error(
          'Sklep blokuje automatyczne pobieranie strony (ochrona anty-bot). Sprawdź, czy JINA_API_KEY jest ustawiony w here.now.',
        )
      }

      return content
    }

    if (response.status === 429 && attempt < maxAttempts - 1) {
      const retryAfterSec = Number(response.headers.get('Retry-After')) || (attempt + 1) * 2
      await sleep(retryAfterSec * 1000)
      continue
    }

    throw new Error(fetchErrorMessage(response.status))
  }

  throw new Error(fetchErrorMessage(429))
}

export async function fetchPageContent(url: string): Promise<string> {
  const fetchUrl = normalizeProductUrl(url)

  if (isIspotUrl(fetchUrl)) {
    return fetchIspotPage(fetchUrl)
  }

  try {
    return await fetchViaJinaGet(fetchUrl)
  } catch (err) {
    if (err instanceof Error && err.message === 'blocked') {
      return fetchViaJinaPost(fetchUrl)
    }
    throw err
  }
}
