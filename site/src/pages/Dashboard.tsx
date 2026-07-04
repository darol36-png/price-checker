import { useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { ProductForm } from '../components/ProductForm'
import { ProductList } from '../components/ProductList'
import { PriceChangeSummaryBanner } from '../components/PriceChangeSummary'
import { useAuth } from '../hooks/useAuth'
import { useProducts } from '../hooks/useProducts'
import { usePriceCheck } from '../hooks/usePriceCheck'
import styles from './Dashboard.module.css'

export function DashboardPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const { products, loading, error, reload, createProduct, updateProduct, deleteProduct } =
    useProducts()
  const { checking, summary, checkPrices, clearSummary } = usePriceCheck()
  const [showForm, setShowForm] = useState(false)
  const checkedOnLogin = useRef(false)

  useEffect(() => {
    if (!user) {
      checkedOnLogin.current = false
    }
  }, [user])

  useEffect(() => {
    if (!user || loading || checkedOnLogin.current) return

    checkedOnLogin.current = true

    if (products.length > 0) {
      void checkPrices(products).then(() => reload())
    }
  }, [user, loading, products, checkPrices, reload])

  if (authLoading) {
    return <p className={styles.loading}>Ładowanie…</p>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const handleManualCheck = async () => {
    await checkPrices(products)
    await reload()
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Price Checker</h1>
          <p className={styles.email}>{user.email}</p>
        </div>
        <button type="button" onClick={() => void signOut()} className={styles.logout}>
          Wyloguj
        </button>
      </header>

      {summary && <PriceChangeSummaryBanner summary={summary} onDismiss={clearSummary} />}

      <section className={styles.toolbar}>
        <h2>Twoje produkty</h2>
        <div className={styles.toolbarActions}>
          <button
            type="button"
            onClick={() => void handleManualCheck()}
            disabled={checking || products.length === 0}
            className={styles.checkBtn}
          >
            {checking ? 'Sprawdzanie cen…' : 'Sprawdź teraz'}
          </button>
          <button type="button" onClick={() => setShowForm(!showForm)} className={styles.addBtn}>
            {showForm ? 'Anuluj' : 'Dodaj produkt'}
          </button>
        </div>
      </section>

      {showForm && (
        <ProductForm
          submitLabel="Dodaj produkt"
          onSubmit={async (name, url) => {
            const result = await createProduct(name, url)
            if (!result.error) setShowForm(false)
            return result
          }}
        />
      )}

      {error && <p className={styles.error}>{error}</p>}

      <ProductList
        products={products}
        loading={loading}
        onUpdate={updateProduct}
        onDelete={deleteProduct}
      />
    </div>
  )
}
