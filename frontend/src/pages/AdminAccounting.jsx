import { useEffect, useState } from 'react'
import { adminFetch } from '../adminApi'

const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
const today = () => iso(new Date())
const fmt = (n) => Number(n || 0).toLocaleString('fr-FR')

const PRESETS = [
  ['Aujourd\'hui', () => [today(), today()]],
  ['7 jours', () => { const d = new Date(); d.setDate(d.getDate() - 6); return [iso(d), today()] }],
  ['Ce mois', () => { const d = new Date(); return [iso(new Date(d.getFullYear(), d.getMonth(), 1)), today()] }],
  ['Mois dernier', () => { const d = new Date(); return [iso(new Date(d.getFullYear(), d.getMonth() - 1, 1)), iso(new Date(d.getFullYear(), d.getMonth(), 0))] }],
]

export default function AdminAccounting() {
  const init = PRESETS[2][1]()
  const [from, setFrom] = useState(init[0])
  const [to, setTo] = useState(init[1])
  const [preset, setPreset] = useState('Ce mois')
  const [tab, setTab] = useState('ecritures')
  const [d, setD] = useState(null)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [ex, setEx] = useState({ label: '', category: '', amount: '', expense_date: today() })

  const load = () =>
    adminFetch(`/api/admin/accounting/summary?from=${from}&to=${to}`)
      .then((r) => { setD(r); setError('') })
      .catch((e) => setError(e.message))

  useEffect(() => { load() }, [from, to])

  const pick = (name, fn) => { const [a, b] = fn(); setFrom(a); setTo(b); setPreset(name) }

  const addExpense = async (e) => {
    e.preventDefault()
    try {
      await adminFetch('/api/admin/expenses', { method: 'POST', body: JSON.stringify({ ...ex, amount: Number(ex.amount) }) })
      setEx({ ...ex, label: '', amount: '' })
      setOk('Dépense ajoutée')
      setTimeout(() => setOk(''), 2500)
      setTab('depenses')
      load()
    } catch (err) { setError(err.message) }
  }

  const delExpense = async (id) => {
    if (!window.confirm('Supprimer cette dépense ?')) return
    try {
      await adminFetch(`/api/admin/expenses/${id}`, { method: 'DELETE' })
      load()
    } catch (err) { setError(err.message) }
  }

  const exportCsv = () => {
    const rows = [
      ['Type', 'Date', 'Référence', 'Libellé', 'Chiffre d\'affaires', 'Frais livraison', 'Coût des ventes', 'Marge', 'Dépense'],
      ...d.entries.map((r) => [r.type, new Date(r.created_at).toLocaleDateString('fr-FR'), `Commande ${r.order_id}`, r.customer_name || '', r.revenue, r.delivery_fee, r.cogs, r.margin, '']),
      ...d.expenses_list.map((r) => ['dépense', String(r.expense_date).slice(0, 10), '', `${r.label}${r.category ? ' (' + r.category + ')' : ''}`, '', '', '', '', r.amount]),
      [], ['Bénéfice', '', '', '', '', '', '', '', d.profit],
    ]
    const csv = '\uFEFF' + rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    a.download = `comptabilite_${from}_${to}.csv`
    a.click()
  }

  const pct = d && d.revenue ? Math.round((d.margin / d.revenue) * 100) : 0
  const sx = (k) => (e) => setEx({ ...ex, [k]: e.target.value })

  return (
    <div className="ac2">
      <div className="ac2-top">
        <h1 className="adm-rv-title">Comptabilité</h1>
        {d && <button type="button" className="ac2-export" onClick={exportCsv}>Exporter (Excel)</button>}
      </div>

      <div className="ac2-period">
        <div className="ac2-chips">
          {PRESETS.map(([name, fn]) => (
            <button type="button" key={name} className={preset === name ? 'on' : ''} onClick={() => pick(name, fn)}>{name}</button>
          ))}
        </div>
        <div className="ac2-dates">
          <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPreset('') }} />
          <span>→</span>
          <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPreset('') }} />
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      {d && (
        <>
          <div className="ac2-kpis">
            <div className={`ac2-main ${d.profit < 0 ? 'neg' : ''}`}>
              <span>Bénéfice net</span>
              <strong>{fmt(d.profit)} <small>FCFA</small></strong>
              <em>{d.orders_count} commande(s) comptabilisée(s)</em>
            </div>
            <div><span>Ventes</span><strong>{fmt(d.revenue)}</strong></div>
            <div><span>Coût des ventes</span><strong>{fmt(d.cogs)}</strong></div>
            <div><span>Marge brute</span><strong>{fmt(d.margin)}</strong><em>{pct} %</em></div>
            <div><span>Dépenses</span><strong>{fmt(d.expenses)}</strong></div>
            <div><span>Livraison encaissée</span><strong>{fmt(d.delivery_fee)}</strong></div>
          </div>

          <div className="ac2-grid">
            <form className="ac2-card ac2-form" onSubmit={addExpense}>
              <h3>Nouvelle dépense</h3>
              <input placeholder="Libellé (transport, emballage, pub…)" value={ex.label} onChange={sx('label')} required />
              <div className="ac2-two">
                <input type="number" min="1" placeholder="Montant" value={ex.amount} onChange={sx('amount')} required />
                <input placeholder="Catégorie" value={ex.category} onChange={sx('category')} />
              </div>
              <input type="date" value={ex.expense_date} onChange={sx('expense_date')} />
              {ok && <p className="ac2-ok">{ok}</p>}
              <button className="ac2-submit">Ajouter</button>
            </form>

            <div className="ac2-card">
              <div className="ac2-tabs">
                <button type="button" className={tab === 'ecritures' ? 'on' : ''} onClick={() => setTab('ecritures')}>Écritures ({d.entries.length})</button>
                <button type="button" className={tab === 'depenses' ? 'on' : ''} onClick={() => setTab('depenses')}>Dépenses ({d.expenses_list.length})</button>
              </div>

              <div className="ac2-list">
                {tab === 'ecritures' && d.entries.length === 0 && <p className="adm-rv-empty">Aucune écriture sur la période.</p>}
                {tab === 'ecritures' && d.entries.map((r) => (
                  <div key={r.id} className="ac2-line">
                    <span className={`ac2-tag ${r.type === 'vente' ? 'v' : 'a'}`}>{r.type === 'vente' ? 'Vente' : 'Annul.'}</span>
                    <span className="ac2-name">#{r.order_id}{r.customer_name ? ` · ${r.customer_name}` : ''}</span>
                    <span className="ac2-meta">marge {fmt(r.margin)} · {new Date(r.created_at).toLocaleDateString('fr-FR')}</span>
                    <strong className={Number(r.revenue) < 0 ? 'neg' : ''}>{fmt(r.revenue)}</strong>
                  </div>
                ))}

                {tab === 'depenses' && d.expenses_list.length === 0 && <p className="adm-rv-empty">Aucune dépense sur la période.</p>}
                {tab === 'depenses' && d.expenses_list.map((r) => (
                  <div key={r.id} className="ac2-line">
                    <span className="ac2-name">{r.label}{r.category ? ` (${r.category})` : ''}</span>
                    <span className="ac2-meta">{String(r.expense_date).slice(0, 10)}</span>
                    <strong>{fmt(r.amount)}</strong>
                    <button type="button" className="ac2-del" onClick={() => delExpense(r.id)} aria-label="Supprimer">✕</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}