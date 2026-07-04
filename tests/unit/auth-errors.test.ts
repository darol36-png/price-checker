import { describe, expect, it } from 'vitest'
import { translateAuthError } from '../../site/src/lib/auth-errors'

describe('translateAuthError', () => {
  it('translates invalid login credentials', () => {
    expect(translateAuthError('Invalid login credentials')).toBe('Błędne dane logowania')
  })

  it('returns unknown messages unchanged', () => {
    expect(translateAuthError('Some other error')).toBe('Some other error')
  })
})
