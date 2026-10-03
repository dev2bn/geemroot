import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CURRENCY } from '../config'
import { getProductImage } from '../productImages'
import { useCart } from '../cart.jsx'

const isUrl = (u) => /^(https?:)?\/\/|^\/api\/uploads\//.test(u || '')
const fmt = (n) => `${Number(n).toLocaleString('fr-FR')} ${CURRENCY}`

export default function ProductCard({ p }) {
  const { add } = useCart()
  const navigate = useNavigate()
  const [added, setAdded] = useState(false)
  const out = p.stock < 1
  const img = isUrl(p.image_url) ? p.image_url : getProductImage(p)

  const addToCart = () => {
    add(p, 1)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  const orderNow = () => {
    add(p, 1)
    navigate('/panier')
  }

  return (
    <div className="card">
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
        <button className="btn btn-outline" disabled={out} onClick={addToCart}>
          {added ? 'Ajouté ✓' : 'Au panier'}
        </button>
        <button className="btn" disabled={out} onClick={orderNow}>
          {out ? 'Rupture' : 'Commander'}
        </button>
      </div>
    </div>
  )
}