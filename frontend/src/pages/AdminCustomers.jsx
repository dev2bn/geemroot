import { useEffect, useState } from 'react'
import { adminFetch } from '../adminApi'
import { CURRENCY } from '../config'

const fmt = (n) => `${Number(n).toLocaleString('fr-FR')} ${CURRENCY}`

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    adminFetch('/api/admin/customers')
      .then(setCustomers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const q = search.toLowerCase()
  const shown = customers.filter(
    (c) =>
      (c.customer_name || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q) ||
      (c.email || '').toLowerCase().includes(q)
  )

  return (
    <div className="adm">
      <div className="adm-head">
        <h1>Clients ({customers.length})</h1>
      </div>

      <input
        className="adm-search"
        placeholder="Rechercher un nom, un téléphone, un email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading && <p>Chargement…</p>}
      {error && <p className="error">{error}</p>}
      {!loading && shown.length === 0 && <p className="adm-empty">Aucun client.</p>}

      <div className="adm-list">
        {shown.map((c) => (
          <div className="adm-card" key={c.phone}>
            <div className="adm-card-top">
              <strong>{c.customer_name}</strong>
              <span className="adm-status">{c.orders_count} commande{c.orders_count > 1 ? 's' : ''}</span>
            </div>
            <p className="adm-name"><a href={`tel:${c.phone}`}>{c.phone}</a>{c.email ? ` · ${c.email}` : ''}</p>
            <p className="adm-addr">{c.address}</p>
            <div className="adm-card-bottom">
              <span>
                Dernière commande :{' '}
                {c.last_order ? new Date(c.last_order).toLocaleDateString('fr-FR') : '-'}
              </span>
              <strong>{fmt(c.total_spent)}</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}