import { describe, expect, it } from 'vitest'
import { fetchErrorMessage } from '../../site/src/lib/fetch-page'

describe('fetchErrorMessage', () => {
  it('returns Polish message for 429', () => {
    expect(fetchErrorMessage(429)).toBe('Przekroczono limit zapytań — spróbuj ponownie za chwilę')
  })

  it('returns generic message for other status codes', () => {
    expect(fetchErrorMessage(500)).toBe('Nie udało się pobrać strony (500)')
  })
})
