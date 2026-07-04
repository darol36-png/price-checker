import { test, expect } from '@playwright/test'

test.describe('Production smoke', () => {
  test('strona logowania ładuje się i wyświetla formularz', async ({ page }) => {
    const response = await page.goto('/login')
    expect(response?.ok()).toBeTruthy()

    await expect(page.getByRole('heading', { name: 'Price Checker' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Zaloguj się' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Rejestracja' })).toBeVisible()
  })

  test('dashboard przekierowuje niezalogowanego użytkownika', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('statyczne assety SPA są dostępne', async ({ page, baseURL }) => {
    test.skip(!baseURL, 'Brak baseURL w konfiguracji Playwright')

    const favicon = await page.request.get(`${baseURL}/favicon.svg`)
    expect(favicon.ok()).toBeTruthy()
    expect(favicon.headers()['content-type']).toMatch(/svg|octet-stream/)

    const index = await page.request.get(baseURL)
    expect(index.ok()).toBeTruthy()
    const html = await index.text()
    expect(html).toContain('root')
  })

  test('proxy Jina Reader odpowiada (bez klucza — może być 401/429, nie 5xx)', async ({
    page,
    baseURL,
  }) => {
    test.skip(!baseURL, 'Brak baseURL w konfiguracji Playwright')

    const response = await page.request.fetch(`${baseURL}/api/jina-reader`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: { url: 'https://example.com' },
    })

    expect(response.status()).toBeLessThan(500)
  })
})
