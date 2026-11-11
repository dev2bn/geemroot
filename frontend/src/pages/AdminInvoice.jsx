import { useEffect } from 'react'
import { CURRENCY } from '../config'
import { useSettings } from '../settings.js'

// Infos optionnelles affichées sous le logo (laisser vide pour masquer)
const SHOP = { phone: '', address: '' }

const fmt = (n) => `${Number(n).toLocaleString('fr-FR')} ${CURRENCY}`

export default function AdminInvoice({ order, onClose }) {
  const settings = useSettings()

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const items = order.items || []
  const number = 'F-' + String(order.id).padStart(4, '0')
  const date = order.created_at ? new Date(order.created_at).toLocaleDateString('fr-FR', { dateStyle: 'long' }) : ''
  const hasFee = Number(order.delivery_fee) > 0
  const digits = (order.phone || '').replace(/\D/g, '')
  const msg = encodeURIComponent(`Bonjour ${order.customer_name}, voici votre facture ${number} : total ${fmt(order.total)}. Merci pour votre commande !`)

  return (
    <div className="inv-wrap" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="inv-bar no-print">
        <button type="button" onClick={() => window.print()}>Imprimer / Enregistrer en PDF</button>
        <a href={`https://wa.me/${digits}?text=${msg}`} target="_blank" rel="noreferrer">WhatsApp</a>
        <a href="#fermer" onClick={(e) => { e.preventDefault(); onClose() }}>Fermer</a>
      </div>

      <div className="inv-page">
        <div className="inv-top">
          <div className="inv-brand">
            {settings.logo_image
              ? <img src={settings.logo_image} alt={settings.logo_text} className="inv-logo" />
              : <div className="inv-name">{settings.logo_text}</div>}
            {SHOP.phone && <div>{SHOP.phone}</div>}
            {SHOP.address && <div>{SHOP.address}</div>}
          </div>
          <div className="inv-meta">
            <h1>FACTURE</h1>
            <div><strong>{number}</strong></div>
            <div>{date}</div>
            <div>Commande n°{order.id}</div>
          </div>
        </div>

        <div className="inv-client">
          <h3>Client</h3>
          <div>{order.customer_name}</div>
          <div>{order.phone}</div>
          {order.email && <div>{order.email}</div>}
          <div>{order.address}</div>
        </div>

        <table className="inv-table">
          <thead>
            <tr><th>Produit</th><th>Prix unitaire</th><th>Qté</th><th>Total</th></tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id}>
                <td>{it.product_name}</td>
                <td>{fmt(it.unit_price)}</td>
                <td>{it.quantity}</td>
                <td>{fmt(it.unit_price * it.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="inv-totals">
          <div><span>Sous-total</span><span>{fmt(order.subtotal)}</span></div>
          <div><span>Livraison</span><span>{hasFee ? fmt(order.delivery_fee) : 'À confirmer'}</span></div>
          <div className="inv-grand"><span>Total</span><span>{fmt(order.total)}</span></div>
        </div>

        <p className="inv-foot">Paiement à la livraison. Merci pour votre confiance !</p>
      </div>
    </div>
  )
}