import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  createProduct,
  createTestClient,
  deleteProductByUrl,
  getIntegrationEnv,
  listProducts,
  signIn,
  signOut,
  testProductUrl,
} from './supabase-test-utils'

const env = getIntegrationEnv()

if (env) {
  describe('Supabase RLS — izolacja produktów między użytkownikami', () => {
    const runId = `run-${Date.now()}`
    const urlA = testProductUrl(runId, 'user-a')
    const urlB = testProductUrl(runId, 'user-b')

    let clientA = createTestClient(env.url, env.anonKey)
    let clientB = createTestClient(env.url, env.anonKey)
    let productAId = ''
    let productBId = ''

    beforeAll(async () => {
      await signIn(clientA, env.userA.email, env.userA.password)
      await signIn(clientB, env.userB.email, env.userB.password)

      const productA = await createProduct(clientA, 'RLS test A', urlA)
      productAId = productA.id

      const productB = await createProduct(clientB, 'RLS test B', urlB)
      productBId = productB.id
    })

    afterAll(async () => {
      await signIn(clientA, env.userA.email, env.userA.password)
      await deleteProductByUrl(clientA, urlA)
      await signOut(clientA)

      await signIn(clientB, env.userB.email, env.userB.password)
      await deleteProductByUrl(clientB, urlB)
      await signOut(clientB)
    })

    it('użytkownik A widzi własny produkt', async () => {
      await signIn(clientA, env.userA.email, env.userA.password)
      const products = await listProducts(clientA)
      expect(products.some((p) => p.id === productAId)).toBe(true)
    })

    it('użytkownik B nie widzi produktu użytkownika A na liście', async () => {
      await signIn(clientB, env.userB.email, env.userB.password)
      const products = await listProducts(clientB)
      expect(products.some((p) => p.id === productAId)).toBe(false)
    })

    it('użytkownik B nie może odczytać produktu A po ID', async () => {
      await signIn(clientB, env.userB.email, env.userB.password)
      const { data, error } = await clientB.from('products').select('*').eq('id', productAId)

      expect(error).toBeNull()
      expect(data).toEqual([])
    })

    it('użytkownik B nie może zaktualizować produktu A', async () => {
      await signIn(clientB, env.userB.email, env.userB.password)
      const { data, error } = await clientB
        .from('products')
        .update({ name: 'Hacked by B' })
        .eq('id', productAId)
        .select('id')

      expect(error).toBeNull()
      expect(data).toEqual([])
    })

    it('użytkownik B nie może usunąć produktu A', async () => {
      await signIn(clientB, env.userB.email, env.userB.password)
      const { data, error } = await clientB
        .from('products')
        .delete()
        .eq('id', productAId)
        .select('id')

      expect(error).toBeNull()
      expect(data).toEqual([])
    })

    it('użytkownik A nadal ma niezmieniony produkt po próbie modyfikacji przez B', async () => {
      await signIn(clientA, env.userA.email, env.userA.password)
      const { data, error } = await clientA
        .from('products')
        .select('name')
        .eq('id', productAId)
        .single()

      expect(error).toBeNull()
      expect(data?.name).toBe('RLS test A')
    })

    it('użytkownik A nie widzi produktu B', async () => {
      await signIn(clientA, env.userA.email, env.userA.password)
      const products = await listProducts(clientA)
      expect(products.some((p) => p.id === productBId)).toBe(false)
    })

    it('użytkownik B widzi własny produkt', async () => {
      await signIn(clientB, env.userB.email, env.userB.password)
      const products = await listProducts(clientB)
      expect(products.some((p) => p.id === productBId)).toBe(true)
    })
  })
} else {
  describe.skip('Supabase RLS — izolacja produktów (brak zmiennych TEST_USER_*)', () => {
    it('placeholder', () => {})
  })
}
