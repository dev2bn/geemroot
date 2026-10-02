import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { adminFetch } from '../adminApi'

const empty = { name: '', description: '', price: '', stock: '', category_id: '', image_url: '' }

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
          category_id: p.category_id ?? '',
          image_url: p.image_url || '',
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

      await adminFetch(id ? `/api/admin/products/${id}` : '/api/admin/products', {
        method: id ? 'PUT' : 'POST',
        body: JSON.stringify({
          ...form,
          image_url,
          price: Number(form.price),
          stock: Number(form.stock),
          category_id: form.category_id ? Number(form.category_id) : null,
        }),
      })
      navigate('/admin/produits')
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <div className="adm">
      <div className="adm-head">
        <h1>{id ? 'Modifier le produit' : 'Nouveau produit'}</h1>
        <Link to="/admin/produits" className="adm-logout">Retour</Link>
      </div>

      <form className="pd-form adm-form" onSubmit={submit}>
        <label>Nom</label>
        <input name="name" value={form.name} onChange={handleChange} required />

        <label>Description</label>
        <textarea name="description" value={form.description} onChange={handleChange} />

        <div className="adm-two">
          <div>
            <label>Prix (FCFA)</label>
            <input name="price" type="number" min="0" value={form.price} onChange={handleChange} required />
          </div>
          <div>
            <label>Stock</label>
            <input name="stock" type="number" min="0" value={form.stock} onChange={handleChange} required />
          </div>
        </div>

        <label>Rubrique</label>
        <select name="category_id" value={form.category_id} onChange={handleChange}>
          <option value="">Aucune rubrique</option>
          {cats.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <div className="adm-inline">
          <input
            placeholder="Ou créer une nouvelle rubrique"
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
          />
          <button type="button" className="adm-add" onClick={addCategory}>Ajouter</button>
        </div>

        <label>Image du produit (jpg, png ou webp, 5 Mo max)</label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setFile(e.target.files[0] || null)}
        />
        {preview && <img src={preview} alt="Aperçu" className="adm-preview" />}

        {error && <p className="error">{error}</p>}
        <button className="pd-btn-dark" type="submit" disabled={saving}>
          {saving ? 'Enregistrement...' : id ? 'Enregistrer' : 'Créer le produit'}
        </button>
      </form>
    </div>
  )
}