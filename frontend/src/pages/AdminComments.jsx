import { useEffect, useState } from 'react'

const headers = () => ({ 'x-admin-key': localStorage.getItem('adminKey') || '' })

export default function AdminComments() {
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const res = await fetch('/api/admin/comments', { headers: headers() })
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

  const act = async (id, method, path = '') => {
    if (method === 'DELETE' && !window.confirm('Supprimer cet avis ?')) return
    const res = await fetch(`/api/admin/comments/${id}${path}`, { method, headers: headers() })
    if (res.ok) setItems((list) => list.filter((c) => c.id !== id))
    else setError('Action impossible')
  }

  return (
    <div className="adm-rv">
      <h1 className="adm-rv-title">
        Avis en attente <span className="adm-rv-count">{items.length}</span>
      </h1>
      {loading && <p className="adm-rv-empty">Chargement...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <p className="adm-rv-empty">Aucun avis en attente.</p>
      )}
      <div className="adm-rv-list">
        {items.map((c) => (
          <div key={c.id} className="adm-rv-card">
            <div className="adm-rv-head">
              <strong>{c.author_name}</strong>
              <span className="adm-rv-meta">
                {c.product_name} · {new Date(c.created_at).toLocaleDateString('fr-FR')}
              </span>
            </div>
            <p className="adm-rv-text">{c.content}</p>
            <div className="adm-rv-actions">
              <button className="adm-rv-ok" onClick={() => act(c.id, 'PATCH', '/approve')}>Approuver</button>
              <button className="adm-rv-del" onClick={() => act(c.id, 'DELETE')}>Supprimer</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}