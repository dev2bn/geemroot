import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { adminFetch } from '../adminApi'

const empty = {
  name: '', description: '', price: '', cost_price: '', stock: '', category_id: '', image_url: '',
  usage_text: '', benefits_text: '', ingredients_text: '',
}

const fmt = (n) => Number(n || 0).toLocaleString('fr-FR')

export default function AdminProductForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(empty)
  const [cats, setCats] = useState([])
  const [newCat, setNewCat] = useState('')
  const [file, setFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    adminFetch('/api/admin/categories').then(setCats).catch((e) => setError(e.message))
  }, [])

  useEffect(() => {
    if (!id) return
    adminFetch(`/api/admin/products/${id}`)
      .then((p) =>
        setForm({
          name: p.name || '',
          description: p.description || '',
          price: p.price ?? '',
          stock: p.stock ?? '',
          cost_price: p.cost_price ?? '',
          category_id: p.category_id ?? '',
          image_url: p.image_url || '',
          usage_text: p.usage_text || '',
          benefits_text: p.benefits_text || '',
          ingredients_text: p.ingredients_text || '',
        })
      )
      .catch((e) => setError(e.message))
  }, [id])

  const preview = useMemo(
    () => (file ? URL.createObjectURL(file) : form.image_url),
    [file, form.image_url]
  )

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  async function addCategory() {
    if (!newCat.trim()) return
    setError('')
    try {
      const created = await adminFetch('/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify({ name: newCat }),
      })
      setCats([...cats, created])
      setForm({ ...form, category_id: created.id })
      setNewCat('')
    } catch (e) {
      setError(e.message)
    }
  }

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      let image_url = form.image_url

      if (file) {
        const fd = new FormData()
        fd.append('image', file)
        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          headers: { 'x-admin-key': localStorage.getItem('adminKey') || '' },
          body: fd,
        })
        const data = await res.json().catch(() => null)
        if (!res.ok) throw new Error((data && data.error) || 'Erreur upload')
        image_url = data.url
      }

      const saved = await adminFetch(id ? `/api/admin/products/${id}` : '/api/admin/products', {
        method: id ? 'PUT' : 'POST',
        body: JSON.stringify({
          ...form,
          image_url,
          price: Number(form.price),
          stock: Number(form.stock),
          category_id: form.category_id ? Number(form.category_id) : null,
        }),
      })
      await adminFetch(`/api/admin/products/${id || saved.id}/cost`, {
        method: 'PUT',
        body: JSON.stringify({ cost_price: Number(form.cost_price) || 0 }),
      })
      navigate('/admin/produits')
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  const price = Number(form.price) || 0
  const cost = Number(form.cost_price) || 0
  const margin = price - cost
  const pct = price ? Math.round((margin / price) * 100) : 0

  return (
    <div className="np">
      <div className="np-top">
        <h1 className="adm-rv-title">{id ? 'Modifier le produit' : 'Nouveau produit'}</h1>
        <Link to="/admin/produits" className="np-back">Retour</Link>
      </div>

      <form onSubmit={submit}>
        <div className="np-grid">
          <div className="np-col">
            <div className="np-card">
              <h3>Informations</h3>
              <label>Nom</label>
              <input name="name" value={form.name} onChange={handleChange} required />

              <label>Description</label>
              <textarea name="description" rows="3" value={form.description} onChange={handleChange} />

              <label>Rubrique</label>
              <select name="category_id" value={form.category_id} onChange={handleChange}>
                <option value="">Aucune rubrique</option>
                {cats.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <div className="np-inline">
                <input placeholder="Ou créer une nouvelle rubrique" value={newCat} onChange={(e) => setNewCat(e.target.value)} />
                <button type="button" onClick={addCategory}>Ajouter</button>
              </div>
            </div>

            <div className="np-card">
              <h3>Fiche produit</h3>
              <p className="np-hint">Laisse vide pour garder le texte par défaut.</p>
              <label>Utilisation</label>
              <textarea name="usage_text" rows="3" value={form.usage_text} onChange={handleChange} />
              <label>Bénéfices</label>
              <textarea name="benefits_text" rows="3" value={form.benefits_text} onChange={handleChange} />
              <label>Ingrédients</label>
              <textarea name="ingredients_text" rows="3" value={form.ingredients_text} onChange={handleChange} />
            </div>
          </div>

          <div className="np-col">
            <div className="np-card">
              <h3>Image</h3>
              <label className="np-drop">
                {preview ? <img src={preview} alt="Aperçu" /> : <span>Choisir une image</span>}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setFile(e.target.files[0] || null)}
                />
              </label>
              <p className="np-hint">{preview ? 'Clique sur l’image pour la changer. ' : ''}jpg, png ou webp, 5 Mo max.</p>
            </div>

            <div className="np-card">
              <h3>Prix et stock</h3>
              <div className="np-three">
                <div>
                  <label>Prix de vente</label>
                  <input name="price" type="number" min="0" value={form.price} onChange={handleChange} required />
                </div>
                <div>
                  <label>Prix d'achat</label>
                  <input name="cost_price" type="number" min="0" value={form.cost_price} onChange={handleChange} />
                </div>
                <div>
                  <label>Stock</label>
                  <input name="stock" type="number" min="0" value={form.stock} onChange={handleChange} required />
                </div>
              </div>
              {price > 0 && (
                <p className="np-margin">
                  Marge par unité : <strong style={{ color: margin < 0 ? '#c0392b' : '#14803c' }}>{fmt(margin)} FCFA</strong>
                  {cost > 0 && <span> ({pct} %)</span>}
                </p>
              )}
            </div>
          </div>
        </div>

        {error && <p className="error">{error}</p>}

        <div className="np-bar">
          <Link to="/admin/produits" className="np-cancel">Annuler</Link>
          <button className="np-save" type="submit" disabled={saving}>
            {saving ? 'Enregistrement...' : id ? 'Enregistrer' : 'Créer le produit'}
          </button>
        </div>
      </form>
    </div>
  )
}