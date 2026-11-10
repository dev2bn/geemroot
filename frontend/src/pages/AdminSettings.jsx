import { useEffect, useMemo, useState } from 'react'
import { adminFetch } from '../adminApi'

export default function AdminSettings() {
  const [logo, setLogo] = useState('')
  const [hero, setHero] = useState('')
  const [file, setFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  useEffect(() => {
    fetch('/api/settings').then((r) => r.json())
      .then((d) => { setLogo(d.logo_text || ''); setHero(d.hero_image || '') })
      .catch((e) => setError(e.message))
  }, [])

  const preview = useMemo(() => (file ? URL.createObjectURL(file) : hero), [file, hero])

  async function submit(e) {
    e.preventDefault()
    setSaving(true); setError(''); setOk('')
    try {
      let hero_image = hero
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
        hero_image = data.url
      }
      const saved = await adminFetch('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({ logo_text: logo, hero_image }),
      })
      setLogo(saved.logo_text); setHero(saved.hero_image || ''); setFile(null)
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
            <h3>Logo (texte)</h3>
            <label>Texte affiché dans l'en-tête</label>
            <input value={logo} maxLength={40} onChange={(e) => setLogo(e.target.value)} placeholder="Geem" />
            <p className="np-hint">Visible en haut du site et dans le menu mobile.</p>
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