import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../cart.jsx'
import { CURRENCY } from '../config'
import { getProductImage } from '../productImages'

const fmt = (n) => `${Number(n).toLocaleString('fr-FR')} ${CURRENCY}`
const isUrl = (u) => /^(https?:)?\/\/|^\/api\/uploads\//.test(u || '')

export default function Cart() {
  const { items, setQty, remove, clear, subtotal } = useCart()
  const [form, setForm] = useState({ customer_name: '', phone: '', email: '', address: '' })
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const valid = form.customer_name && form.phone && form.email && form.address

  async function confirm() {
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          items: items.map((i) => ({ product_id: i.id, quantity: i.quantity })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la commande')
      clear()
      window.location.href = data.whatsappUrl
    } catch (err) {
      setError(err.message)
      setSending(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="cart">
        <h1>Mon panier</h1>
        <p className="adm-empty">Votre panier est vide.</p>
        <Link to="/" className="btn" style={{ marginTop: 16 }}>Voir les produits</Link>
      </div>
    )
  }

  return (
    <div className="cart">
      <h1>Mon panier</h1>

      {items.map((i) => (
        <div className="cart-item" key={i.id}>
          <img src={isUrl(i.image) ? i.image : getProductImage({ id: i.id })} alt="" />
          <div className="cart-info">
            <Link to={`/produit/${i.id}`}><strong>{i.name}</strong></Link>
            <span>{fmt(i.price)}</span>
            <button className="cart-rm" onClick={() => remove(i.id)}>Retirer</button>
          </div>
          <div className="qty">
            <button onClick={() => setQty(i.id, i.quantity - 1)}>−</button>
            <span>{i.quantity}</span>
            <button onClick={() => setQty(i.id, i.quantity + 1)}>+</button>
          </div>
          <div className="cart-line">{fmt(i.price * i.quantity)}</div>
        </div>
      ))}

      <div className="pd-sum" style={{ marginTop: 16 }}>
        <p><span>Livraison</span><span>à confirmer</span></p>
        <p className="pd-total"><span>Sous-total</span><span>{fmt(subtotal)}</span></p>
      </div>

      <div className="pd-form" style={{ marginTop: 24 }}>
        <h3>Vos informations</h3>
        <input name="customer_name" placeholder="Nom" value={form.customer_name} onChange={handleChange} />
        <input name="phone" placeholder="Téléphone" value={form.phone} onChange={handleChange} />
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} />
        <textarea name="address" placeholder="Adresse de livraison" value={form.address} onChange={handleChange} />
        <p className="pd-small">Paiement à la livraison.</p>
        {error && <p className="error">{error}</p>}
        <button className="pd-btn-dark" onClick={confirm} disabled={!valid || sending}>
          {sending ? 'Envoi...' : 'Confirmer et envoyer sur WhatsApp'}
        </button>
      </div>
    </div>
  )
}