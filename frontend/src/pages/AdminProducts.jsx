import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminFetch } from '../adminApi'
import { CURRENCY } from '../config'
import { getProductImage } from '../productImages.js'

const fmt = (n) => `${Number(n).toLocaleString('fr-FR')} ${CURRENCY}`

const imageOf = (p) =>
  /^(https?:)?\/\/|^\/api\/uploads\//.test(p.image_url || '') ? p.image_url : getProductImage(p)

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = () =>
    adminFetch('/api/admin/products')
      .then(setProducts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))

  useEffect(() => {
    load()
  }, [])

  async function remove(p) {
    if (!window.confirm(`Supprimer « ${p.name} » ?`)) return
    try {
      await adminFetch(`/api/admin/products/${p.id}`, { method: 'DELETE' })
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="adm">
      <div className="adm-head">
        <h1>Produits ({products.length})</h1>
        <Link to="/admin/produits/nouveau" className="adm-add">+ Nouveau produit</Link>
      </div>

      {loading && <p>Chargement…</p>}
      {error && <p className="error">{error}</p>}
      {!loading && products.length === 0 && <p className="adm-empty">Aucun produit.</p>}

      <div className="adm-list">
        {products.map((p) => {
          const img = imageOf(p)
          return (
            <div className="adp-row" key={p.id}>
              {img ? <img src={img} alt="" /> : <div className="adp-noimg" />}
              <div className="adp-info">
                <strong>{p.name}</strong>
                <span>{fmt(p.price)} · Stock : {p.stock}{p.category ? ` · ${p.category}` : ''}</span>
              </div>
              <div className="adp-actions">
                <Link to={`/admin/produits/${p.id}/modifier`}>Modifier</Link>
                <button onClick={() => remove(p)}>Supprimer</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}