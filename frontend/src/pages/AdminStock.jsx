import { useEffect, useState } from 'react'
import { adminFetch } from '../adminApi'

const LOW = 5
const fmt = (n) => Number(n || 0).toLocaleString('fr-FR')
const REASONS = { commande: 'Commande', annulation: 'Annulation', reactivation: 'Réactivation', entree: 'Entrée', ajustement: 'Ajustement' }
const blank = { product_id: '', reason: 'entree', quantity: '', unit_cost: '', note: '' }

export default function AdminStock() {
  const [products, setProducts] = useState([])
  const [moves, setMoves] = useState([])
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [all, setAll] = useState(false)
  const [f, setF] = useState(blank)

  const load = () =>
    Promise.all([adminFetch('/api/admin/stock'), adminFetch('/api/admin/stock/movements')])
      .then(([p, m]) => { setProducts(p); setMoves(m) })
      .catch((e) => setError(e.message))

  useEffect(() => { load() }, [])

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const step = (d) => {
    const min = f.reason === 'entree' ? 0 : -9999
    setF({ ...f, quantity: String(Math.max(min, (Number(f.quantity) || 0) + d)) })
  }

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setOk('')
    try {
      await adminFetch('/api/admin/stock/move', {
        method: 'POST',
        body: JSON.stringify({ ...f, product_id: Number(f.product_id), quantity: Number(f.quantity), unit_cost: Number(f.unit_cost) || 0 }),
      })
      setF({ ...f, quantity: '', unit_cost: '', note: '' })
      setOk('Mouvement enregistré')
      setTimeout(() => setOk(''), 2500)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const value = products.reduce((s, p) => s + p.stock * Number(p.cost_price || 0), 0)
  const low = products.filter((p) => p.stock <= LOW).length
  const q = search.toLowerCase()
  const shown = products.filter((p) => p.name.toLowerCase().includes(q))
  const sel = products.find((p) => String(p.id) === String(f.product_id))
  const qty = Number(f.quantity) || 0
  const after = sel ? sel.stock + qty : null
  const list = all ? moves : moves.slice(0, 8)

  return (
    <div className="sk">
      <h1 className="adm-rv-title">Stock</h1>
      {error && <p className="error">{error}</p>}

      <div className="sk-stats">
        <div><span>Valeur du stock</span><strong>{fmt(value)} FCFA</strong></div>
        <div><span>Produits</span><strong>{products.length}</strong></div>
        <div className={low ? 'sk-warn' : ''}><span>Stock bas</span><strong>{low}</strong></div>
      </div>

      <div className="sk-grid">
        <form className="sk-card sk-form" onSubmit={submit}>
          <h3>Nouveau mouvement</h3>

          <div className="sk-seg">
            <button type="button" className={f.reason === 'entree' ? 'on' : ''} onClick={() => setF({ ...f, reason: 'entree' })}>Entrée</button>
            <button type="button" className={f.reason === 'ajustement' ? 'on' : ''} onClick={() => setF({ ...f, reason: 'ajustement', quantity: '' })}>Ajustement</button>
          </div>

          <select value={f.product_id} onChange={set('product_id')} required>
            <option value="">Choisir un produit</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>

          <div className="sk-row">
            <div className="sk-step">
              <button type="button" onClick={() => step(-1)} aria-label="Moins">−</button>
              <input type="number" placeholder="Qté" value={f.quantity} onChange={set('quantity')} required />
              <button type="button" onClick={() => step(1)} aria-label="Plus">+</button>
            </div>
            {f.reason === 'entree' && (
              <input type="number" min="0" placeholder="Prix d'achat unitaire" value={f.unit_cost} onChange={set('unit_cost')} />
            )}
          </div>

          <input placeholder={f.reason === 'ajustement' ? 'Motif (casse, inventaire…)' : 'Note (optionnel)'} value={f.note} onChange={set('note')} />

          {sel && (
            <p className="sk-preview">
              {sel.name} : {sel.stock} → <strong style={{ color: after < 0 ? '#c0392b' : '#14803c' }}>{after}</strong>
            </p>
          )}
          {ok && <p className="sk-ok">{ok}</p>}

          <button className="sk-submit" disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
        </form>

        <div className="sk-card">
          <div className="sk-head">
            <h3>Produits</h3>
            <input className="sk-search" placeholder="Rechercher" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="sk-list">
            {shown.length === 0 && <p className="adm-rv-empty">Aucun produit.</p>}
            {shown.map((p) => (
              <button type="button" key={p.id} className={`sk-prod ${String(p.id) === String(f.product_id) ? 'sel' : ''}`} onClick={() => setF({ ...f, product_id: String(p.id) })}>
                <span className="sk-name">{p.name}</span>
                <span className="sk-cost">{fmt(p.cost_price)}</span>
                <span className={`sk-badge ${p.stock <= 0 ? 'out' : p.stock <= LOW ? 'low' : ''}`}>{p.stock}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="sk-card sk-hist">
        <div className="sk-head">
          <h3>Historique</h3>
          {moves.length > 8 && <button type="button" className="sk-link" onClick={() => setAll(!all)}>{all ? 'Réduire' : 'Voir tout'}</button>}
        </div>
        {moves.length === 0 && <p className="adm-rv-empty">Aucun mouvement.</p>}
        {list.map((m) => (
          <div key={m.id} className="sk-mv">
            <span className="sk-name">{m.product_name || 'Produit supprimé'}</span>
            <span className={`sk-qty ${m.quantity < 0 ? 'neg' : 'pos'}`}>{m.quantity > 0 ? '+' : ''}{m.quantity}</span>
            <span className="sk-meta">{REASONS[m.reason] || m.reason}{m.order_id ? ` #${m.order_id}` : ''} · {new Date(m.created_at).toLocaleDateString('fr-FR')}</span>
          </div>
        ))}
      </div>
    </div>
  )
}