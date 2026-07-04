import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Product } from '../../site/src/types/database'

export interface IntegrationEnv {
  url: string
  anonKey: string
  userA: { email: string; password: string }
  userB: { email: string; password: string }
}

export function getIntegrationEnv(): IntegrationEnv | null {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
  const emailA = process.env.TEST_USER_A_EMAIL
  const passwordA = process.env.TEST_USER_A_PASSWORD
  const emailB = process.env.TEST_USER_B_EMAIL
  const passwordB = process.env.TEST_USER_B_PASSWORD

  if (!url || !anonKey || !emailA || !passwordA || !emailB || !passwordB) {
    return null
  }

  return {
    url,
    anonKey,
    userA: { email: emailA, password: passwordA },
    userB: { email: emailB, password: passwordB },
  }
}

export function createTestClient(url: string, anonKey: string): SupabaseClient {
  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

export async function signIn(
  client: SupabaseClient,
  email: string,
  password: string,
): Promise<void> {
  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) {
    throw new Error(`Logowanie ${email} nie powiodło się: ${error.message}`)
  }
}

export async function signOut(client: SupabaseClient): Promise<void> {
  await client.auth.signOut()
}

export function testProductUrl(runId: string, label: string): string {
  return `https://price-checker-integration.test/${runId}/${label}`
}

export async function createProduct(
  client: SupabaseClient,
  name: string,
  url: string,
): Promise<Product> {
  const { data, error } = await client
    .from('products')
    .insert({ name, url })
    .select('*')
    .single<Product>()

  if (error) throw error
  return data
}

export async function deleteProductByUrl(client: SupabaseClient, url: string): Promise<void> {
  await client.from('products').delete().eq('url', url)
}

export async function listProducts(client: SupabaseClient): Promise<Product[]> {
  const { data, error } = await client.from('products').select('*').returns<Product[]>()
  if (error) throw error
  return data ?? []
}
