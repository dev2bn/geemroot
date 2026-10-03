import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { adminFetch } from '../adminApi'
import { CURRENCY } from '../config'

const fmt = (n) => `${Number(n).toLocaleString('fr-FR')} ${CURRENCY}`

export default function AdminCustomer() {
  const { key } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    adminFetch(`/api/admin/customers/${key}`)
      .then(setData)
      .catch((e) => setError(e.message))
  }, [key])

  if (error) return <p className="error">{error}</p>
  if (!data) return <p>Chargement…</p>

  const { customer: c, orders } = data
  const digits = (c.phone || '').replace(/\D/g, '')

  return (
    <div className="adm ao">
      <Link to="/admin/clients" className="ao-back">← Clients</Link>

      <header className="ao-head">
        <div>
          <h1>{c.customer_name}</h1>
          <p>{c.orders_count} commande{c.orders_count > 1 ? 's' : ''} · {fmt(c.total_spent)} dépensés</p>
        </div>
      </header>

      <div className="ao-grid">
        <div className="ao-col">
          <section className="ao-card">
            <h2>Historique ({orders.length})</h2>
            <div className="adm-list">
              {orders.map((o) => (
                <Link to={`/admin/commande/${o.id}`} key={o.id} className="adm-card" style={{ background: '#fff' }}>
                  <div className="adm-card-top">
                    <strong>Commande n°{o.id}</strong>
                    <span className={`adm-status s-${o.status}`}>{o.status}</span>
                  </div>
                  <div className="adm-card-bottom" style={{ marginTop: 8 }}>
                    <span>
                      {o.created_at
                        ? new Date(o.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
                        : ''}
                    </span>
                    <strong>{fmt(o.total)}</strong>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <div className="ao-col">
          <section className="ao-card">
            <h2>Contact</h2>
            <p className="ao-kv"><span>Téléphone</span>{c.phone}</p>
            {c.email && <p className="ao-kv"><span>Email</span>{c.email}</p>}
            <p className="ao-kv"><span>Dernière adresse</span>{c.address}</p>
            <div className="ao-actions">
              <a href={`tel:${c.phone}`}>Appeler</a>
              <a className="alt" href={`https://wa.me/${digits}`} target="_blank" rel="noreferrer">WhatsApp</a>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}