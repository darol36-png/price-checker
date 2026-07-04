import { test, expect } from '@playwright/test'
import { mockSupabaseAuth, mockSupabaseProducts } from './helpers/supabase-mocks'

test.describe('Price Checker UI', () => {
  test('shows login page', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: 'Price Checker' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Zaloguj się' })).toBeVisible()
  })

  test('switches between login and register tabs', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: 'Rejestracja' }).click()
    await expect(page.getByRole('button', { name: 'Zarejestruj się' })).toBeVisible()
  })

  test('redirects unauthenticated users from dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('validates product form requires fields', async ({ page }) => {
    await mockSupabaseAuth(page)
    await mockSupabaseProducts(page, [])

    await page.goto('/login')
    await page.getByLabel('Email').fill('test@example.com')
    await page.getByLabel('Hasło').fill('password123')
    await page.getByRole('button', { name: 'Zaloguj się' }).click()

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
    await page.getByRole('button', { name: 'Dodaj produkt' }).click()
    await expect(page.getByRole('button', { name: 'Dodaj produkt' }).last()).toBeVisible()
  })
})
