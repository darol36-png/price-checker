import { test, expect } from '@playwright/test'
import {
  mockSupabaseAuth,
  mockSupabasePriceHistory,
} from './helpers/supabase-mocks'

const MOCK_PRODUCT = {
  id: 'prod-1',
  user_id: 'user-1',
  name: 'Test Phone',
  url: 'https://example.com/phone',
  current_price: 1000,
  currency: 'PLN',
  last_checked_at: '2026-01-01T00:00:00Z',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

const MOCK_PAGE = `
  <html>
    <script type="application/ld+json">
    {"@type":"Product","offers":{"price":"900.00","priceCurrency":"PLN"}}
    </script>
  </html>
`

test.describe('Price check flow', () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabaseAuth(page)

    let productPrice = 1000

    await page.route('**/rest/v1/products**', async (route) => {
      const method = route.request().method()

      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{ ...MOCK_PRODUCT, current_price: productPrice }]),
        })
        return
      }

      if (method === 'PATCH') {
        const body = route.request().postDataJSON() as { current_price?: number }
        if (body.current_price != null) productPrice = body.current_price
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{ ...MOCK_PRODUCT, current_price: productPrice }]),
        })
        return
      }

      if (method === 'POST') {
        await route.fulfill({ status: 201, contentType: 'application/json', body: '{}' })
        return
      }

      await route.continue()
    })

    await mockSupabasePriceHistory(page)

    const fulfillMockPage = async (route: import('@playwright/test').Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: MOCK_PAGE,
      })
    }

    await page.route('**/api/fetch/**', fulfillMockPage)

    await page.route('**/api/jina-reader', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { content: MOCK_PAGE } }),
      })
    })
  })

  test('shows price decrease summary after login', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill('test@example.com')
    await page.getByLabel('Hasło').fill('password123')
    await page.getByRole('button', { name: 'Zaloguj się' }).click()

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
    await expect(page.getByText('Podsumowanie cen')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(/taniej/)).toBeVisible()
  })
})
