const TRACKING_PARAM_PREFIXES = ['utm_', '_branch']
const TRACKING_PARAM_NAMES = new Set(['gclid', 'fbclid', 'msclkid', 'ceneo_cid'])

function isTrackingParam(name: string): boolean {
  if (TRACKING_PARAM_NAMES.has(name)) return true
  if (TRACKING_PARAM_PREFIXES.some((prefix) => name.startsWith(prefix))) return true
  if (name.startsWith('~') || name.startsWith('$')) return true
  return false
}

function normalizeEmpikUrl(parsed: URL): string {
  const mpShopId = parsed.searchParams.get('mpShopId')
  parsed.search = mpShopId ? `?mpShopId=${mpShopId}` : ''
  parsed.hash = ''
  return parsed.toString()
}

export function normalizeProductUrl(url: string): string {
  const trimmed = url.trim()
  let parsed: URL

  try {
    parsed = new URL(trimmed)
  } catch {
    return trimmed
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return trimmed
  }

  const host = parsed.hostname.replace(/^www\./, '')
  if (host === 'empik.com') {
    return normalizeEmpikUrl(parsed)
  }

  for (const key of [...parsed.searchParams.keys()]) {
    if (isTrackingParam(key)) {
      parsed.searchParams.delete(key)
    }
  }

  parsed.hash = ''
  return parsed.toString()
}
