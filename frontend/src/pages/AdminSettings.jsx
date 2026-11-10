import { useEffect, useMemo, useState } from 'react'
import { adminFetch } from '../adminApi'

async function upload(file) {
  const fd = new FormData()
  fd.append('image', file)
  const res = await fetch('/api/admin/upload', {
    method: 'POST',
    headers: { 'x-admin-key': localStorage.getItem('adminKey') || '' },
    body: fd,
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error((data && data.error) || 'Erreur upload')
  return data.url
}

export default function AdminSettings() {
  const [logo, setLogo] = useState('')
  const [logoImg, setLogoImg] = useState('')
  const [logoFile, setLogoFile] = useState(null)
  const [hero, setHero] = useState('')
  const [file, setFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  useEffect(() => {
    fetch('/api/settings').then((r) => r.json())
      .then((d) => { setLogo(d.logo_text || ''); setLogoImg(d.logo_image || ''); setHero(d.hero_image || '') })
      .catch((e) => setError(e.message))
  }, [])

  const logoPreview = useMemo(() => (logoFile ? URL.createObjectURL(logoFile) : logoImg), [logoFile, logoImg])
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : hero), [file, hero])

  async function submit(e) {
    e.preventDefault()
    setSaving(true); setError(''); setOk('')
    try {
      const logo_image = logoFile ? await upload(logoFile) : logoImg
      const hero_image = file ? await upload(file) : hero
      const saved = await adminFetch('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({ logo_text: logo, logo_image, hero_image }),
      })
      setLogo(saved.logo_text); setLogoImg(saved.logo_image || ''); setHero(saved.hero_image || '')
      setLogoFile(null); setFile(null)
      setOk('Enregistré')
      setTimeout(() => setOk(''), 2500)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="np">
      <h1 className="adm-rv-title">Apparence</h1>
      <form onSubmit={submit}>
        <div className="np-grid">
          <div className="np-card">
            <h3>Logo</h3>
            <label>Texte (affiché si aucune image)</label>
            <input value={logo} maxLength={40} onChange={(e) => setLogo(e.target.value)} placeholder="Geem" />

            <label>Image du logo</label>
            <label className="np-logo-drop">
              {logoPreview ? <img src={logoPreview} alt="Logo" /> : <span>Choisir une image</span>}
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setLogoFile(e.target.files[0] || null)} />
            </label>
            <p className="np-hint">Format horizontal conseillé, PNG transparent idéalement. L'image est réduite automatiquement à 36 px de haut maximum : elle ne modifie pas la taille de la barre.</p>
            {logoPreview && (
              <button type="button" className="sk-link" onClick={() => { setLogoFile(null); setLogoImg('') }}>Retirer l'image (revenir au texte)</button>
            )}
          </div>

          <div className="np-card">
            <h3>Photo de l'accueil</h3>
            <label className="np-drop">
              {preview ? <img src={preview} alt="Aperçu" /> : <span>Choisir une image</span>}
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files[0] || null)} />
            </label>
            <p className="np-hint">jpg, png ou webp, 5 Mo max.</p>
            {preview && (
              <button type="button" className="sk-link" onClick={() => { setFile(null); setHero('') }}>Retirer la photo</button>
            )}
          </div>
        </div>

        {error && <p className="error">{error}</p>}
        {ok && <p className="sk-ok">{ok}</p>}

        <div className="np-bar">
          <button className="np-save" type="submit" disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
        </div>
      </form>
    </div>
  )
}