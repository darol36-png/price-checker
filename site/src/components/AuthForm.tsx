import { useState, type FormEvent } from 'react'
import { useAuth } from '../hooks/useAuth'
import styles from './AuthForm.module.css'

type Mode = 'login' | 'register'

interface AuthFormProps {
  onSuccess?: () => void
}

export function AuthForm({ onSuccess }: AuthFormProps) {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const result = mode === 'login' ? await signIn(email, password) : await signUp(email, password)

    setLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }

    onSuccess?.()
  }

  return (
    <div className={styles.card}>
      <h1>Price Checker</h1>
      <p className={styles.subtitle}>Śledź ceny produktów po każdym logowaniu</p>

      <div className={styles.tabs}>
        <button
          type="button"
          className={mode === 'login' ? styles.tabActive : styles.tab}
          onClick={() => setMode('login')}
        >
          Logowanie
        </button>
        <button
          type="button"
          className={mode === 'register' ? styles.tabActive : styles.tab}
          onClick={() => setMode('register')}
        >
          Rejestracja
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </label>
        <label>
          Hasło
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
        </label>

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" disabled={loading} className={styles.submit}>
          {loading ? 'Proszę czekać…' : mode === 'login' ? 'Zaloguj się' : 'Zarejestruj się'}
        </button>
      </form>
    </div>
  )
}
