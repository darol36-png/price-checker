import { Navigate } from 'react-router-dom'
import { AuthForm } from '../components/AuthForm'
import { useAuth } from '../hooks/useAuth'
import styles from './Login.module.css'

export function LoginPage() {
  const { user, loading } = useAuth()

  if (loading) {
    return <p className={styles.loading}>Ładowanie…</p>
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className={styles.page}>
      <AuthForm />
    </div>
  )
}
