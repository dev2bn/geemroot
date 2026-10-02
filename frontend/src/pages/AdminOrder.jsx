import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { adminFetch } from '../adminApi'
import { CURRENCY } from '../config'
import { getProductImage } from '../productImages.js'

const STATUSES = ['nouvelle', 'confirmée', 'livrée', 'annulée']
const fmt = (n) => `${Number(n).toLocaleString('fr-FR')} ${CURRENCY}`
const isUrl = (u) => /^(https?:)?\/\/|^\/api\/uploads\//.test(u || '')

const TABS = { articles: 'Articles', client: 'Client', livraison: 'Livraison', statut: 'Statut' }

export default function AdminOrder() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('articles')
  const [sel, setSel] = useState(0)

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
  const current = items[sel] || items[0]
  const bigImg = current ? imageFor(current) : null
  const delivery = Number(order.delivery_fee) > 0 ? fmt(order.delivery_fee) : 'À confirmer'
  const date = order.created_at
    ? new Date(order.created_at).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })
    : ''

  return (
    <div className="pd pdo">
      <nav className="pd-crumbs">
        <Link to="/admin">Commandes</Link>
        <span>›</span>
        <strong>n°{order.id}</strong>
      </nav>

      <div className="pd-grid">
        {/* Colonne image */}
        <div>
          <div className="pd-frame">
            {bigImg ? <img src={bigImg} alt={current.product_name} /> : <div className="pdo-noimg pdo-big" />}
          </div>
          {current && (
            <p className="pdo-cap">
              {current.product_name} × {current.quantity}
            </p>
          )}
          <div className="pd-thumbs">
            {items.map((it, i) => {
              const img = imageFor(it)
              return (
                <button
                  key={it.id}
                  type="button"
                  className={`pd-thumb ${i === sel ? 'active' : ''}`}
                  onClick={() => setSel(i)}
                >
                  {img ? <img src={img} alt="" /> : <div className="pdo-noimg" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Colonne infos */}
        <div className="pd-info">
          <div className="pd-head">
            <h1>Commande n°{order.id}</h1>
            <span className={`pd-badge s-${order.status}`}>{order.status}</span>
          </div>
          <p className="pd-price">{fmt(order.total)}</p>
          <p className="pd-desc">
            {date}
            <br />
            {order.customer_name} · {order.phone}
          </p>

          {error && <p className="error">{error}</p>}

          <div className="pd-tabs">
            {Object.entries(TABS).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={tab === key ? 'active' : ''}
                onClick={() => setTab(key)}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === 'articles' && (
            <div className="pdo-pane">
              {items.map((it) => {
                const img = imageFor(it)
                return (
                  <div className="pdo-row" key={it.id}>
                    {img ? <img src={img} alt="" /> : <div className="pdo-noimg" />}
                    <div>
                      <strong>{it.product_name}</strong>
                      <span>{fmt(it.unit_price)} × {it.quantity}</span>
                    </div>
                    <strong>{fmt(it.unit_price * it.quantity)}</strong>
                  </div>
                )
              })}
              <div className="pd-sum" style={{ marginTop: 14 }}>
                <p><span>Sous-total</span><span>{fmt(order.subtotal)}</span></p>
                <p><span>Livraison</span><span>{delivery}</span></p>
                <p className="pd-total"><span>Total</span><span>{fmt(order.total)}</span></p>
              </div>
            </div>
          )}

          {tab === 'client' && (
            <div className="pdo-pane">
              <p className="pdo-kv"><span>Nom</span>{order.customer_name}</p>
              <p className="pdo-kv"><span>Téléphone</span><a href={`tel:${order.phone}`}>{order.phone}</a></p>
              {order.email && (
                <p className="pdo-kv"><span>Email</span><a href={`mailto:${order.email}`}>{order.email}</a></p>
              )}
              <p className="pdo-kv"><span>Adresse</span>{order.address}</p>
            </div>
          )}

          {tab === 'livraison' && (
            <div className="pdo-pane">
              <p className="pdo-kv"><span>Adresse de livraison</span>{order.address}</p>
              <p className="pdo-kv"><span>Frais de livraison</span>{delivery}</p>
              <p className="pdo-kv"><span>Paiement</span>À la livraison</p>
            </div>
          )}

          {tab === 'statut' && (
            <div className="pdo-pane">
              <p className="pdo-kv"><span>Statut actuel</span>{order.status}</p>
              <div className="pdo-status">
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
            </div>
          )}
        </div>
      </div>
    </div>
  )
}