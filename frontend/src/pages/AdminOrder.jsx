import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { adminFetch } from '../adminApi'
import { CURRENCY } from '../config'
import { getProductImage } from '../productImages.js'

const STATUSES = ['nouvelle', 'confirmée', 'livrée', 'annulée']
const fmt = (n) => `${Number(n).toLocaleString('fr-FR')} ${CURRENCY}`
const isUrl = (u) => /^(https?:)?\/\/|^\/api\/uploads\//.test(u || '')

export default function AdminOrder() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    Promise.all([
      adminFetch(`/api/orders/${id}`),
      adminFetch('/api/admin/products').catch(() => []),
    ])
      .then(([o, p]) => {
        setOrder(o)
        setProducts(p)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  async function changeStatus(status) {
    if (status === order.status) return
    if (status === 'annulée' && !window.confirm('Annuler la commande ? Le stock sera remis.')) return
    setUpdating(true)
    setError('')
    try {
      const updated = await adminFetch(`/api/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      setOrder({ ...order, status: updated.status })
    } catch (e) {
      setError(e.message)
    } finally {
      setUpdating(false)
    }
  }

  const imageFor = (it) => {
    const p = products.find((x) => x.id === it.product_id)
    return isUrl(p && p.image_url) ? p.image_url : getProductImage({ id: it.product_id })
  }

  if (loading) return <p>Chargement…</p>
  if (!order) return <p className="error">{error || 'Commande introuvable'}</p>

  const items = order.items || []
  const delivery = Number(order.delivery_fee) > 0 ? fmt(order.delivery_fee) : 'À confirmer'
  const date = order.created_at
    ? new Date(order.created_at).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })
    : ''
  const digits = (order.phone || '').replace(/\D/g, '')

  return (
    <div className="adm ao">
      <Link to="/admin" className="ao-back">← Commandes</Link>

      <header className="ao-head">
        <div>
          <h1>Commande n°{order.id}</h1>
          <p>{date}</p>
        </div>
        <span className={`adm-status ao-badge s-${order.status}`}>{order.status}</span>
      </header>

      {error && <p className="error">{error}</p>}

      <div className="ao-grid">
        <div className="ao-col">
          <section className="ao-card">
            <h2>Articles ({items.length})</h2>
            {items.map((it) => {
              const img = imageFor(it)
              return (
                <div className="ao-item" key={it.id}>
                  {img ? <img src={img} alt="" /> : <div className="ao-noimg" />}
                  <div className="ao-item-info">
                    <strong>{it.product_name}</strong>
                    <span>{fmt(it.unit_price)} × {it.quantity}</span>
                  </div>
                  <strong>{fmt(it.unit_price * it.quantity)}</strong>
                </div>
              )
            })}
            <div className="ao-totals">
              <div><span>Sous-total</span><span>{fmt(order.subtotal)}</span></div>
              <div><span>Livraison</span><span>{delivery}</span></div>
              <div className="ao-total"><span>Total</span><span>{fmt(order.total)}</span></div>
            </div>
          </section>
        </div>

        <div className="ao-col">
          <section className="ao-card">
            <h2>Client</h2>
            <p className="ao-kv"><span>Nom</span>{order.customer_name}</p>
            <p className="ao-kv"><span>Téléphone</span>{order.phone}</p>
            {order.email && <p className="ao-kv"><span>Email</span>{order.email}</p>}
            <div className="ao-actions">
              <a href={`tel:${order.phone}`}>Appeler</a>
              <a className="alt" href={`https://wa.me/${digits}`} target="_blank" rel="noreferrer">WhatsApp</a>
            </div>
          </section>

          <section className="ao-card">
            <h2>Livraison</h2>
            <p className="ao-kv"><span>Adresse</span>{order.address}</p>
            <p className="ao-kv"><span>Frais</span>{delivery}</p>
            <p className="ao-kv"><span>Paiement</span>À la livraison</p>
          </section>

          <section className="ao-card">
            <h2>Statut</h2>
            <div className="ao-status">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  disabled={updating}
                  className={order.status === s ? 'current' : ''}
                  onClick={() => changeStatus(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}