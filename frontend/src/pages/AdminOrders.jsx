import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CURRENCY } from '../config'

const STATUSES = ['nouvelle', 'confirmée', 'livrée', 'annulée']
const fmt = (n) => `${Number(n).toLocaleString('fr-FR')} ${CURRENCY}`

export default function AdminOrders() {
  const [key, setKey] = useState(localStorage.getItem('adminKey') || '')
  const [input, setInput] = useState('')
  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState('toutes')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!key) return
    setLoading(true)
    setError('')
    fetch('/api/orders', { headers: { 'x-admin-key': key } })
      .then(async (res) => {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('adminKey')
          setKey('')
          throw new Error('Clé incorrecte')
        }
        if (!res.ok) throw new Error('Erreur de chargement')
        return res.json()
      })
      .then(setOrders)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [key])

  function submit(e) {
    e.preventDefault()
    localStorage.setItem('adminKey', input)
    setKey(input)
  }

  function logout() {
    localStorage.removeItem('adminKey')
    setKey('')
    setOrders([])
  }

  if (!key) {
    return (
      <form onSubmit={submit} className="adm-login">
        <h2>Accès vendeuse</h2>
        {error && <p className="error">{error}</p>}
        <input
          type="password"
          placeholder="Clé admin"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="pd-btn-dark">Entrer</button>
      </form>
    )
  }

  const count = (s) => orders.filter((o) => o.status === s).length
  const shown = filter === 'toutes' ? orders : orders.filter((o) => o.status === filter)

  return (
    <div className="adm">
      <div className="adm-head">
        <h1>Commandes</h1>
        <button className="adm-logout" onClick={logout}>Déconnexion</button>
      </div>

      <div className="adm-filters">
        <button className={filter === 'toutes' ? 'active' : ''} onClick={() => setFilter('toutes')}>
          Toutes ({orders.length})
        </button>
        {STATUSES.map((s) => (
          <button key={s} className={filter === s ? 'active' : ''} onClick={() => setFilter(s)}>
            {s} ({count(s)})
          </button>
        ))}
      </div>

      {loading && <p>Chargement…</p>}
      {error && <p className="error">{error}</p>}
      {!loading && shown.length === 0 && <p className="adm-empty">Aucune commande.</p>}

      <div className="adm-list">
        {shown.map((o) => (
          <Link to={`/admin/commande/${o.id}`} key={o.id} className="adm-card">
            <div className="adm-card-top">
              <strong>Commande n°{o.id}</strong>
              <span className={`adm-status s-${o.status}`}>{o.status}</span>
            </div>
            <p className="adm-name">{o.customer_name} · {o.phone}</p>
            <p className="adm-addr">{o.address}</p>
            <div className="adm-card-bottom">
              <span>{o.created_at ? new Date(o.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : ''}</span>
              <strong>{fmt(o.total)}</strong>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}