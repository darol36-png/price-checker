import { useState } from 'react'
import type { Product } from '../types/database'
import { formatPrice } from '../lib/price-diff'
import { ProductForm } from './ProductForm'
import styles from './ProductList.module.css'

interface ProductListProps {
  products: Product[]
  loading: boolean
  onUpdate: (id: string, name: string, url: string) => Promise<{ error: string | null }>
  onDelete: (id: string) => Promise<{ error: string | null }>
}

export function ProductList({ products, loading, onUpdate, onDelete }: ProductListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  if (loading) {
    return <p className={styles.muted}>Ładowanie produktów…</p>
  }

  if (products.length === 0) {
    return <p className={styles.muted}>Brak produktów. Dodaj pierwszy link do śledzenia.</p>
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Usunąć ten produkt?')) return
    setActionError(null)
    const result = await onDelete(id)
    if (result.error) setActionError(result.error)
  }

  return (
    <div className={styles.list}>
      {actionError && <p className={styles.error}>{actionError}</p>}

      {products.map((product) => (
        <article key={product.id} className={styles.item}>
          {editingId === product.id ? (
            <ProductForm
              initialName={product.name}
              initialUrl={product.url}
              submitLabel="Zapisz zmiany"
              onSubmit={async (name, url) => {
                const result = await onUpdate(product.id, name, url)
                if (!result.error) setEditingId(null)
                return result
              }}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <>
              <div className={styles.info}>
                <h3>{product.name || 'Bez nazwy'}</h3>
                <a href={product.url} target="_blank" rel="noreferrer" className={styles.link}>
                  {product.url}
                </a>
                <p className={styles.price}>
                  {product.current_price != null
                    ? formatPrice(product.current_price, product.currency)
                    : 'Cena nieznana'}
                  {product.last_checked_at && (
                    <span className={styles.checked}>
                      {' '}
                      · sprawdzono {new Date(product.last_checked_at).toLocaleString('pl-PL')}
                    </span>
                  )}
                </p>
              </div>
              <div className={styles.actions}>
                <button type="button" onClick={() => setEditingId(product.id)} className={styles.edit}>
                  Edytuj
                </button>
                <button type="button" onClick={() => void handleDelete(product.id)} className={styles.delete}>
                  Usuń
                </button>
              </div>
            </>
          )}
        </article>
      ))}
    </div>
  )
}
