import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { CURRENCY } from '../config'
import { getProductImage } from '../productImages'
import Hero from '../components/Hero'

export default function Catalog() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  const renderCard = (p) => (
    <Link to={`/produit/${p.id}`} key={p.id} className="card">
      <img className="card-img" src={getProductImage(p)} alt={p.name} loading="lazy" />
      <div className="card-body">
        <div className="card-name">{p.name}</div>
        <div className="card-desc">{p.description}</div>
      </div>
      <div className="card-foot">
        <span className="price">{fmt(p.price)}</span>
        <span className="btn">Voir</span>
      </div>
    </Link>
  )

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