import { useState, type FormEvent } from 'react'
import styles from './ProductForm.module.css'

interface ProductFormProps {
  initialName?: string
  initialUrl?: string
  submitLabel: string
  onSubmit: (name: string, url: string) => Promise<{ error: string | null }>
  onCancel?: () => void
}

export function ProductForm({
  initialName = '',
  initialUrl = '',
  submitLabel,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const [name, setName] = useState(initialName)
  const [url, setUrl] = useState(initialUrl)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const result = await onSubmit(name, url)
    setLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }

    if (!onCancel) {
      setName('')
      setUrl('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <label>
        Nazwa produktu
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="np. iPhone 15"
          required
        />
      </label>
      <label>
        Link do produktu
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          required
        />
      </label>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.actions}>
        {onCancel && (
          <button type="button" onClick={onCancel} className={styles.cancel}>
            Anuluj
          </button>
        )}
        <button type="submit" disabled={loading} className={styles.submit}>
          {loading ? 'Zapisywanie…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
