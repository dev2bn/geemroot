import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { CURRENCY } from '../config'

const SORTS = {
  recent: 'Nouveautés',
  asc: 'Prix croissant',
  desc: 'Prix décroissant',
  name: 'Nom A-Z',
}

export default function Products() {
  const [params] = useSearchParams()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [q, setQ] = useState('')
  const [cat, setCat] = useState(params.get('rubrique') || '')
  const [min, setMin] = useState('')
  const [max, setMax] = useState('')
  const [inStock, setInStock] = useState(false)
  const [sort, setSort] = useState('recent')
  const [open, setOpen] = useState(false)

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

  const categories = useMemo(() => {
    const map = new Map()
    for (const p of products) {
      if (p.category) map.set(p.category, (map.get(p.category) || 0) + 1)
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], 'fr'))
  }, [products])

  const bounds = useMemo(() => {
    const prices = products.map((p) => Number(p.price))
    return prices.length
      ? { lo: Math.min(...prices), hi: Math.max(...prices) }
      : { lo: 0, hi: 0 }
  }, [products])

  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    const lo = min === '' ? -Infinity : Number(min)
    const hi = max === '' ? Infinity : Number(max)

    const r = products.filter((p) => {
      if (cat && p.category !== cat) return false
      const price = Number(p.price)
      if (price < lo || price > hi) return false
      if (inStock && p.stock < 1) return false
      if (s && !`${p.name} ${p.description || ''}`.toLowerCase().includes(s)) return false
      return true
    })

    if (sort === 'asc') r.sort((a, b) => Number(a.price) - Number(b.price))
    else if (sort === 'desc') r.sort((a, b) => Number(b.price) - Number(a.price))
    else if (sort === 'name') r.sort((a, b) => a.name.localeCompare(b.name, 'fr'))
    else r.sort((a, b) => b.id - a.id)
    return r
  }, [products, q, cat, min, max, inStock, sort])

  const activeCount = [q.trim(), cat, min, max, inStock].filter(Boolean).length

  const reset = () => {
    setQ('')
    setCat('')
    setMin('')
    setMax('')
    setInStock(false)
    setSort('recent')
  }

  return (
    <div className="pf">
      <h1>Tous les produits</h1>
      <p className="pf-sub">Trouvez le soin qui vous convient.</p>

      <div className="pf-layout">
        <aside className={`pf-side ${open ? 'open' : ''}`}>
          <div>
            <h3>Recherche</h3>
            <input
              className="pf-input"
              placeholder="Rechercher un produit…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          {categories.length > 0 && (
            <div>
              <h3>Rubrique</h3>
              <div className="pf-chips">
                <button className={`pf-chip ${cat === '' ? 'active' : ''}`} onClick={() => setCat('')}>
                  Toutes
                </button>
                {categories.map(([name, n]) => (
                  <button
                    key={name}
                    className={`pf-chip ${cat === name ? 'active' : ''}`}
                    onClick={() => setCat(cat === name ? '' : name)}
                  >
                    {name}<small>{n}</small>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3>Prix ({CURRENCY})</h3>
            <div className="pf-price">
              <input
                className="pf-input"
                type="number"
                min="0"
                placeholder={`Min ${bounds.lo}`}
                value={min}
                onChange={(e) => setMin(e.target.value)}
              />
              <input
                className="pf-input"
                type="number"
                min="0"
                placeholder={`Max ${bounds.hi}`}
                value={max}
                onChange={(e) => setMax(e.target.value)}
              />
            </div>
          </div>

          <label className="pf-check">
            <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} />
            En stock uniquement
          </label>

          <button className="pf-reset" onClick={reset}>Réinitialiser</button>
        </aside>

        <div>
          <div className="pf-bar">
            <span className="pf-count">
              {loading ? 'Chargement…' : `${list.length} produit${list.length > 1 ? 's' : ''}`}
            </span>
            <div className="pf-bar-right">
              <button className="pf-toggle" onClick={() => setOpen((o) => !o)}>
                Filtres{activeCount > 0 ? ` (${activeCount})` : ''}
              </button>
              <select className="pf-input pf-sort" value={sort} onChange={(e) => setSort(e.target.value)}>
                {Object.entries(SORTS).map(([k, label]) => (
                  <option key={k} value={k}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {error && <p className="error">{error}</p>}

          {!loading && !error && list.length === 0 && (
            <div className="pf-empty">
              <p>Aucun produit ne correspond à votre recherche.</p>
              <button className="btn" onClick={reset}>Réinitialiser les filtres</button>
            </div>
          )}

          <div className="grid">
            {list.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}