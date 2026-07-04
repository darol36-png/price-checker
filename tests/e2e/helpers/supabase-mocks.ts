import type { Page } from '@playwright/test'

export const MOCK_USER = {
  id: 'user-1',
  email: 'test@example.com',
}

export const MOCK_SESSION = {
  access_token: 'fake-token',
  token_type: 'bearer',
  expires_in: 3600,
  refresh_token: 'refresh',
  user: MOCK_USER,
}

/** Mocki dla bezpośredniego połączenia z Supabase (nie przez /api/supabase proxy). */
export async function mockSupabaseAuth(page: Page): Promise<void> {
  await page.route('**/auth/v1/token**', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SESSION),
      })
      return
    }
    await route.continue()
  })

  await page.route('**/auth/v1/user**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_USER),
    })
  })
}

export async function mockSupabaseProducts(
  page: Page,
  initialProducts: unknown[] = [],
): Promise<{ setProducts: (products: unknown[]) => void }> {
  let products = [...initialProducts]

  await page.route('**/rest/v1/products**', async (route) => {
    const method = route.request().method()
    const url = route.request().url()

    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(products),
      })
      return
    }

    if (method === 'PATCH') {
      const body = route.request().postDataJSON() as Record<string, unknown>
      const idMatch = url.match(/id=eq\.([^&]+)/)
      const id = idMatch?.[1]
      if (id) {
        products = products.map((p) => {
          const product = p as { id: string }
          return product.id === id ? { ...product, ...body } : p
        })
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(products),
      })
      return
    }

    if (method === 'POST') {
      await route.fulfill({ status: 201, contentType: 'application/json', body: '{}' })
      return
    }

    await route.continue()
  })

  return {
    setProducts(next) {
      products = [...next]
    },
  }
}

export async function mockSupabasePriceHistory(page: Page): Promise<void> {
  await page.route('**/rest/v1/price_history**', async (route) => {
    await route.fulfill({ status: 201, contentType: 'application/json', body: '{}' })
  })
}
