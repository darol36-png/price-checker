import { useCallback, useEffect, useState } from 'react'
import type { Product } from '../types/database'
import { supabase } from '../lib/supabase-client'
import { useAuth } from './useAuth'

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function useProducts() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadProducts = useCallback(async () => {
    if (!user) {
      setProducts([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .returns<Product[]>()

    if (fetchError) {
      setError(fetchError.message)
      setProducts([])
    } else {
      setProducts(data ?? [])
    }

    setLoading(false)
  }, [user])

  useEffect(() => {
    void loadProducts()
  }, [loadProducts])

  const createProduct = async (name: string, url: string) => {
    if (!user) return { error: 'Brak zalogowanego użytkownika' }
    if (!isValidUrl(url)) return { error: 'Nieprawidłowy adres URL' }

    const { error: insertError } = await supabase.from('products').insert({
      name: name.trim(),
      url: url.trim(),
    })

    if (insertError) return { error: insertError.message }

    await loadProducts()
    return { error: null }
  }

  const updateProduct = async (id: string, name: string, url: string) => {
    if (!isValidUrl(url)) return { error: 'Nieprawidłowy adres URL' }

    const existing = products.find((p) => p.id === id)
    const urlChanged = existing && existing.url !== url.trim()

    const updates: {
      name: string
      url: string
      current_price?: null
      last_checked_at?: null
    } = {
      name: name.trim(),
      url: url.trim(),
    }

    if (urlChanged) {
      updates.current_price = null
      updates.last_checked_at = null
    }

    const { error: updateError } = await supabase.from('products').update(updates).eq('id', id)

    if (updateError) return { error: updateError.message }

    await loadProducts()
    return { error: null }
  }

  const deleteProduct = async (id: string) => {
    const { error: deleteError } = await supabase.from('products').delete().eq('id', id)

    if (deleteError) return { error: deleteError.message }

    await loadProducts()
    return { error: null }
  }

  return {
    products,
    loading,
    error,
    reload: loadProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  }
}
