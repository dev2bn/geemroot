import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CURRENCY } from '../config'
import { getProductImage } from '../productImages'
import { useCart } from '../cart.jsx'
import Hero from '../components/Hero'

const isUrl = (u) => /^(https?:)?\/\/|^\/api\/uploads\//.test(u || '')

export default function Catalog() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [addedId, setAddedId] = useState(null)
  const { add } = useCart()
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/api/products')
      .then((res) => {
        if (!res.ok) throw new Error('Erreur de chargement')
        return res.json()
      })
      .then((data) => setProducts(Array.isArray(data) ? data : data.products || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const fmt = (n) => `${Number(n).toLocaleString('fr-FR')} ${CURRENCY}`

  const sections = useMemo(() => {
    const map = new Map()
    for (const p of products) {
      if (!p.category) continue
      if (!map.has(p.category)) map.set(p.category, [])
      map.get(p.category).push(p)
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], 'fr'))
  }, [products])

  const addToCart = (p) => {
    add(p, 1)
    setAddedId(p.id)
    setTimeout(() => setAddedId(null), 1500)
  }

  const orderNow = (p) => {
    add(p, 1)
    navigate('/panier')
  }

  const renderCard = (p) => {
    const out = p.stock < 1
    const img = isUrl(p.image_url) ? p.image_url : getProductImage(p)
    return (
      <div key={p.id} className="card">
        <Link to={`/produit/${p.id}`} className="card-link">
          <img className="card-img" src={img} alt={p.name} loading="lazy" />
          <div className="card-body">
            <div className="card-name">{p.name}</div>
            <div className="card-desc">{p.description}</div>
          </div>
        </Link>

        <div className="card-foot">
          <span className="price">{fmt(p.price)}</span>
        </div>

        <div className="card-actions">
          <button className="btn btn-outline" disabled={out} onClick={() => addToCart(p)}>
            {addedId === p.id ? 'Ajouté ✓' : 'Au panier'}
          </button>
          <button className="btn" disabled={out} onClick={() => orderNow(p)}>
            {out ? 'Rupture' : 'Commander'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <section id="produits">
        <Hero />
        <h2 className="title">Nos produits</h2>

        {loading && <p>Chargement…</p>}
        {error && <p className="error">{error}</p>}

        <div className="grid">{products.map(renderCard)}</div>
      </section>

      {sections.map(([name, items]) => (
        <section key={name} className="cat-section">
          <h2 className="title">{name}</h2>
          <div className="grid">{items.map(renderCard)}</div>
        </section>
      ))}
    </>
  )
}