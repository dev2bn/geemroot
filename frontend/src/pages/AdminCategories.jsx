import { useEffect, useState } from 'react'
import { adminFetch } from '../adminApi'

export default function AdminCategories() {
  const [cats, setCats] = useState([])
  const [products, setProducts] = useState([])
  const [name, setName] = useState('')
  const [openId, setOpenId] = useState(null)
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = () =>
    Promise.all([adminFetch('/api/admin/categories'), adminFetch('/api/admin/products')])
      .then(([c, p]) => {
        setCats(c)
        setProducts(p)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))

  useEffect(() => {
    load()
  }, [])

  async function run(fn) {
    setError('')
    try {
      await fn()
      await load()
    } catch (e) {
      setError(e.message)
    }
  }

  const create = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    run(async () => {
      await adminFetch('/api/admin/categories', { method: 'POST', body: JSON.stringify({ name }) })
      setName('')
    })
  }

  const rename = (c) => {
    const n = window.prompt('Nouveau nom de la rubrique', c.name)
    if (!n || !n.trim() || n.trim() === c.name) return
    run(() => adminFetch(`/api/admin/categories/${c.id}`, { method: 'PUT', body: JSON.stringify({ name: n }) }))
  }

  const remove = (c) => {
    if (!window.confirm(`Supprimer la rubrique « ${c.name} » ? Les produits ne seront pas supprimés.`)) return
    run(() => adminFetch(`/api/admin/categories/${c.id}`, { method: 'DELETE' }))
  }

  function toggleOpen(c) {
    if (openId === c.id) return setOpenId(null)
    setOpenId(c.id)
    setSelected(products.filter((p) => p.category_id === c.id).map((p) => p.id))
  }

  const toggleProduct = (id) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  const saveAssign = (c) =>
    run(async () => {
      await adminFetch(`/api/admin/categories/${c.id}/products`, {
        method: 'PUT',
        body: JSON.stringify({ product_ids: selected }),
      })
      setOpenId(null)
    })

  return (
    <div className="adm">
      <div className="adm-head">
        <h1>Rubriques ({cats.length})</h1>
      </div>

      <form className="adm-inline" onSubmit={create}>
        <input placeholder="Nom de la nouvelle rubrique" value={name} onChange={(e) => setName(e.target.value)} />
        <button type="submit" className="adm-add">Créer</button>
      </form>

      {loading && <p>Chargement…</p>}
      {error && <p className="error">{error}</p>}
      {!loading && cats.length === 0 && <p className="adm-empty">Aucune rubrique.</p>}

      <div className="adm-list">
        {cats.map((c) => (
          <div className="adc-card" key={c.id}>
            <div className="adc-top">
              <div>
                <strong>{c.name}</strong>
                <span>{c.products_count} produit{c.products_count > 1 ? 's' : ''}</span>
              </div>
              <div className="adp-actions">
                <button className="adc-plain" onClick={() => toggleOpen(c)}>
                  {openId === c.id ? 'Fermer' : 'Produits'}
                </button>
                <button className="adc-plain" onClick={() => rename(c)}>Renommer</button>
                <button onClick={() => remove(c)}>Supprimer</button>
              </div>
            </div>

            {openId === c.id && (
              <div className="adc-assign">
                {products.length === 0 && <p className="adm-empty">Aucun produit.</p>}
                {products.map((p) => (
                  <label key={p.id}>
                    <input
                      type="checkbox"
                      checked={selected.includes(p.id)}
                      onChange={() => toggleProduct(p.id)}
                    />
                    <span>{p.name}</span>
                    {p.category && p.category_id !== c.id && <small>actuellement : {p.category}</small>}
                  </label>
                ))}
                <button className="pd-btn-dark" onClick={() => saveAssign(c)}>Enregistrer</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}