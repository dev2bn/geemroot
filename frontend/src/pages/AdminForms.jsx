import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const headers = () => ({ 'x-admin-key': localStorage.getItem('adminKey') || '', 'Content-Type': 'application/json' })

export default function AdminForms() {
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const res = await fetch('/api/admin/forms', { headers: headers() })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setItems(data)
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const toggle = async (f) => {
    const res = await fetch(`/api/admin/forms/${f.id}/active`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({ active: !f.is_active }),
    })
    if (res.ok) load()
    else setError('Action impossible')
  }

  const remove = async (f) => {
    if (!window.confirm(`Supprimer "${f.title}" et ses ${f.responses} réponse(s) ?`)) return
    const res = await fetch(`/api/admin/forms/${f.id}`, { method: 'DELETE', headers: headers() })
    if (res.ok) load()
    else setError('Suppression impossible')
  }

  return (
    <div className="adm-fm">
      <div className="adm-fm-bar">
        <h1 className="adm-rv-title">Formulaires</h1>
        <Link to="/admin/formulaires/nouveau" className="adm-rv-ok adm-fm-btn">+ Nouveau</Link>
      </div>
      {loading && <p className="adm-rv-empty">Chargement...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && items.length === 0 && <p className="adm-rv-empty">Aucun formulaire.</p>}
      <div className="adm-rv-list">
        {items.map((f) => (
          <div key={f.id} className="adm-rv-card">
            <div className="adm-rv-head">
              <strong>{f.title}</strong>
              <span className="adm-rv-meta">{f.responses} réponse(s)</span>
              {f.is_active && <span className="adm-fm-live">Actif</span>}
            </div>
            <div className="adm-rv-actions" style={{ marginTop: 8, flexWrap: 'wrap' }}>
              <button className="adm-rv-ok" onClick={() => toggle(f)}>{f.is_active ? 'Désactiver' : 'Activer'}</button>
              <Link className="adm-fm-link" to={`/admin/formulaires/${f.id}/resultats`}>Résultats</Link>
              <Link className="adm-fm-link" to={`/admin/formulaires/${f.id}/modifier`}>Modifier</Link>
              <button className="adm-rv-del" onClick={() => remove(f)}>Supprimer</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}