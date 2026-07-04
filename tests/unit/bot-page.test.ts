import { describe, expect, it } from 'vitest'
import { isBlockedPage } from '../../site/src/lib/bot-page'

describe('isBlockedPage', () => {
  it('detects Cloudflare bot wall', () => {
    const content = '## Performing security verification\nverify you are not a bot'
    expect(isBlockedPage(content)).toBe(true)
  })

  it('detects javascript cookie wall', () => {
    expect(isBlockedPage('Enable JavaScript and cookies to continue')).toBe(true)
  })

  it('does not flag pages with product prices', () => {
    const content =
      'Performing security verification data-price-amount="6299" data-price-type="finalPrice"'
    expect(isBlockedPage(content)).toBe(false)
  })
})
