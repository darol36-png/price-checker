import { useState } from 'react'
import type { PriceChangeSummary } from '../types/database'
import { formatPrice } from '../lib/price-diff'
import styles from './PriceChangeSummary.module.css'

interface PriceChangeSummaryProps {
  summary: PriceChangeSummary
  onDismiss: () => void
}

export function PriceChangeSummaryBanner({ summary, onDismiss }: PriceChangeSummaryProps) {
  const [expanded, setExpanded] = useState(false)

  const total =
    summary.up.length +
    summary.down.length +
    summary.unchanged.length +
    summary.firstCheck.length +
    summary.errors.length

  if (total === 0) return null

  const parts: string[] = []
  if (summary.down.length) parts.push(`${summary.down.length} taniej`)
  if (summary.up.length) parts.push(`${summary.up.length} drożej`)
  if (summary.unchanged.length) parts.push(`${summary.unchanged.length} bez zmian`)
  if (summary.firstCheck.length) parts.push(`${summary.firstCheck.length} nowych cen`)
  if (summary.errors.length) parts.push(`${summary.errors.length} błędów`)

  const headline = parts.join(', ')

  return (
    <div className={styles.banner} role="status">
      <div className={styles.header}>
        <div>
          <strong>Podsumowanie cen ({total} produktów)</strong>
          <p className={styles.headline}>{headline}</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" onClick={() => setExpanded(!expanded)} className={styles.toggle}>
            {expanded ? 'Ukryj szczegóły' : 'Pokaż szczegóły'}
          </button>
          <button type="button" onClick={onDismiss} className={styles.dismiss} aria-label="Zamknij">
            ×
          </button>
        </div>
      </div>

      {expanded && (
        <ul className={styles.details}>
          {[...summary.down, ...summary.up, ...summary.unchanged, ...summary.firstCheck, ...summary.errors].map(
            (item) => (
              <li key={item.productId} className={styles[`status_${item.status}`] ?? styles.status_error}>
                <span className={styles.name}>{item.productName}</span>
                {item.status === 'error' ? (
                  <span>{item.error}</span>
                ) : item.newPrice != null ? (
                  <span>
                    {item.previousPrice != null && (
                      <>
                        {formatPrice(item.previousPrice, item.currency)} →{' '}
                      </>
                    )}
                    {formatPrice(item.newPrice, item.currency)}
                    {item.status === 'up' && ' ↑'}
                    {item.status === 'down' && ' ↓'}
                    {item.status === 'unchanged' && ' ='}
                    {item.status === 'first_check' && ' (pierwsze sprawdzenie)'}
                  </span>
                ) : null}
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  )
}
