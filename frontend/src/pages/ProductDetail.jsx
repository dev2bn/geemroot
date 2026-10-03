import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CURRENCY } from '../config.js'
import { getProductImage } from '../productImages.js'
import { useCart } from '../cart.jsx'

const fmt = (n) => Number(n).toLocaleString('fr-FR')

const TABS = {
  usage: {
    label: 'Utilisation',
    text: "Appliquer quelques gouttes sur le cuir chevelu et masser doucement pendant 5 minutes. Laisser poser 30 minutes ou toute la nuit, puis rincer. Utiliser 2 à 3 fois par semaine.",
  },
  benefits: {
    label: 'Bénéfices',
    text: "Stimule la pousse, fortifie les racines, nourrit le cuir chevelu et protège les longueurs.",
  },
  ingredients: {
    label: 'Ingrédients',
    text: "Huiles 100 % naturelles. Liste complète des ingrédients à compléter.",
  },
  delivery: {
    label: 'Livraison',
    text: "Paiement à la livraison. Les frais de livraison sont confirmés par la vendeuse selon votre adresse.",
  },
}

export default function ProductDetail() {
  const { id } = useParams()
  const { add } = useCart()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [sending, setSending] = useState(false)
  const [tab, setTab] = useState('usage')
  const [form, setForm] = useState({
    customer_name: '',
    phone: '',
    email: '',
    address: '',
  })

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error('Produit introuvable')
        return r.json()
      })
      .then((p) => setProduct(p))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const subtotal = product ? Number(product.price) * quantity : 0

  const formValid = form.customer_name && form.phone && form.email && form.address

  const confirmOrder = async () => {
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          items: [{ product_id: product.id, quantity }],
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la commande')
      window.location.href = data.whatsappUrl
    } catch (err) {
      setError(err.message)
      setSending(false)
    }
  }

  if (loading) return <p>Chargement...</p>
  if (!product) return <p className="error">{error || 'Produit introuvable'}</p>

  const img = /^(https?:)?\/\/|^\/api\/uploads\//.test(product.image_url || '') ? product.image_url : getProductImage(product)
  const outOfStock = product.stock < 1

  return (
    <div className="pd">
      <nav className="pd-crumbs">
        <Link to="/">Accueil</Link>
        <span>›</span>
        <Link to="/">Produits</Link>
        <span>›</span>
        <strong>{product.name}</strong>
      </nav>

      <div className="pd-grid">
        <div>
          <div className="pd-frame">
            {img && <img src={img} alt={product.name} />}
          </div>
          <div className="pd-thumbs">
            {[0, 1, 2, 3].map((i) => (
              <button key={i} className={`pd-thumb ${i === 0 ? 'active' : ''}`} type="button">
                {img && <img src={img} alt="" />}
              </button>
            ))}
          </div>
        </div>

        <div className="pd-info">
          <div className="pd-head">
            <h1>{product.name}</h1>
            <span className="pd-badge">Best seller</span>
          </div>
          <p className="pd-price">{fmt(product.price)} {CURRENCY}</p>
          <p className="pd-desc">{product.description}</p>

          {!showForm && (
            <>
              <p className="pd-label">Quantité</p>
              <div className="pd-qty-row">
                <div className="pd-qty">
                  <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>−</button>
                  <span>{quantity}</span>
                  <button type="button" onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}>+</button>
                </div>
                <small>Stock : {product.stock}</small>
              </div>

              <button className="pd-btn-dark" onClick={() => setShowForm(true)} disabled={outOfStock}>
                {outOfStock ? 'Rupture de stock' : 'Commander maintenant'}
              </button>
              <button
                className="pd-btn-outline"
                type="button"
                disabled={outOfStock}
                onClick={() => {
                  add(product, quantity)
                  setAdded(true)
                }}
              >
                {added ? 'Ajouté ✓' : 'Ajouter au panier'}
              </button>
              {added && <Link to="/panier" className="pd-small">Voir le panier →</Link>}
            </>
          )}

          {showForm && !showSummary && (
            <div className="pd-form">
              <h3>Vos informations</h3>
              <input name="customer_name" placeholder="Nom" value={form.customer_name} onChange={handleChange} />
              <input name="phone" placeholder="Téléphone" value={form.phone} onChange={handleChange} />
              <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} />
              <textarea name="address" placeholder="Adresse de livraison" value={form.address} onChange={handleChange} />
              <button className="pd-btn-dark" onClick={() => setShowSummary(true)} disabled={!formValid}>
                Voir le récapitulatif
              </button>
              <button className="pd-btn-outline" onClick={() => setShowForm(false)}>Retour</button>
            </div>
          )}

          {showSummary && (
            <div className="pd-form">
              <h3>Récapitulatif</h3>
              <div className="pd-sum">
                <p><span>{product.name} x{quantity}</span><span>{fmt(subtotal)} {CURRENCY}</span></p>
                <p><span>Livraison</span><span>à confirmer</span></p>
                <p className="pd-total"><span>Sous-total</span><span>{fmt(subtotal)} {CURRENCY}</span></p>
              </div>
              <p className="pd-small">
                Paiement à la livraison.<br />
                {form.customer_name} · {form.phone}<br />
                {form.address}
              </p>
              <button className="pd-btn-dark" onClick={confirmOrder} disabled={sending}>
                {sending ? 'Envoi...' : 'Confirmer et envoyer sur WhatsApp'}
              </button>
              <button className="pd-btn-outline" onClick={() => setShowSummary(false)} disabled={sending}>
                Modifier
              </button>
            </div>
          )}

          {error && <p className="error">{error}</p>}

          <div className="pd-tabs">
            {Object.entries(TABS).map(([key, t]) => (
              <button
                key={key}
                type="button"
                className={tab === key ? 'active' : ''}
                onClick={() => setTab(key)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <p className="pd-tab-text">{TABS[tab].text}</p>
        </div>
      </div>
    </div>
  )
}