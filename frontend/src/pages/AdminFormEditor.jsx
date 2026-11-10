import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'

const headers = () => ({ 'x-admin-key': localStorage.getItem('adminKey') || '', 'Content-Type': 'application/json' })

const TYPES = [
  ['text', 'Texte court'],
  ['textarea', 'Texte long'],
  ['single', 'Choix unique'],
  ['multi', 'Choix multiple'],
  ['select', 'Liste déroulante'],
  ['rating', 'Note (1 à 5 étoiles)'],
  ['number', 'Nombre'],
  ['yesno', 'Oui / Non'],
]
const HAS_OPTIONS = ['single', 'multi', 'select']
const newQ = () => ({ type: 'text', label: '', options: '', required: false })

export default function AdminFormEditor() {
  const { id } = useParams()
  const nav = useNavigate()
  const [title, setTitle] = useState('')
  const [banner, setBanner] = useState('')
  const [steps, setSteps] = useState([[newQ()]])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`/api/admin/forms/${id}`, { headers: headers() })
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!ok) throw new Error(d.error || 'Erreur')
        setTitle(d.title)
        setBanner(d.banner_text || '')
        const keys = [...new Set(d.questions.map((q) => q.step))].sort((a, b) => a - b)
        const grouped = keys.map((k) =>
          d.questions.filter((q) => q.step === k).map((q) => ({
            type: q.type,
            label: q.label,
            options: (q.options || []).join('\n'),
            required: q.required,
          }))
        )
        setSteps(grouped.length ? grouped : [[newQ()]])
      })
      .catch((err) => setError(err.message))
  }, [id])

  const setQ = (si, qi, patch) =>
    setSteps((s) => s.map((qs, i) => (i !== si ? qs : qs.map((q, j) => (j !== qi ? q : { ...q, ...patch })))))
  const addQ = (si) => setSteps((s) => s.map((qs, i) => (i === si ? [...qs, newQ()] : qs)))
  const delQ = (si, qi) =>
    setSteps((s) => s.map((qs, i) => (i === si ? qs.filter((_, j) => j !== qi) : qs)))
  const addStep = () => setSteps((s) => [...s, [newQ()]])
  const delStep = (si) => setSteps((s) => (s.length > 1 ? s.filter((_, i) => i !== si) : s))

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      const questions = steps.flatMap((qs, si) =>
        qs.map((q) => ({
          step: si + 1,
          type: q.type,
          label: q.label,
          options: q.options.split('\n').map((o) => o.trim()).filter(Boolean),
          required: q.required,
        }))
      )
      const res = await fetch(id ? `/api/admin/forms/${id}` : '/api/admin/forms', {
        method: id ? 'PUT' : 'POST',
        headers: headers(),
        body: JSON.stringify({ title, banner_text: banner, questions }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Erreur')
      nav('/admin/formulaires')
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <div className="adm-fm">
      <h1 className="adm-rv-title">{id ? 'Modifier le formulaire' : 'Nouveau formulaire'}</h1>

      <div className="adm-rv-card adm-fm-box">
        <input placeholder="Titre du formulaire" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input
          placeholder="Texte du bandeau défilant (ex : Donnez-nous votre avis !)"
          value={banner}
          onChange={(e) => setBanner(e.target.value)}
        />
      </div>

      {steps.map((qs, si) => (
        <div key={si} className="adm-fm-step">
          <div className="adm-fm-bar">
            <strong>Étape {si + 1}</strong>
            {steps.length > 1 && (
              <button type="button" className="adm-rv-del adm-fm-small" onClick={() => delStep(si)}>
                Supprimer l'étape
              </button>
            )}
          </div>
          {qs.map((q, qi) => (
            <div key={qi} className="adm-rv-card adm-fm-box">
              <input
                placeholder="Question"
                value={q.label}
                onChange={(e) => setQ(si, qi, { label: e.target.value })}
              />
              <div className="adm-fm-row">
                <select value={q.type} onChange={(e) => setQ(si, qi, { type: e.target.value })}>
                  {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <label className="adm-fm-check">
                  <input
                    type="checkbox"
                    checked={q.required}
                    onChange={(e) => setQ(si, qi, { required: e.target.checked })}
                  />
                  Obligatoire
                </label>
                <button type="button" className="adm-rv-del adm-fm-small" onClick={() => delQ(si, qi)}>✕</button>
              </div>
              {HAS_OPTIONS.includes(q.type) && (
                <textarea
                  placeholder={'Un choix par ligne\nExemple :\nOui\nNon'}
                  value={q.options}
                  onChange={(e) => setQ(si, qi, { options: e.target.value })}
                />
              )}
            </div>
          ))}
          <button type="button" className="adm-fm-link" onClick={() => addQ(si)}>+ Question</button>
        </div>
      ))}

      <button type="button" className="adm-fm-link" onClick={addStep}>+ Ajouter une étape</button>

      {error && <p className="error">{error}</p>}
      <div className="adm-rv-actions" style={{ marginTop: 16 }}>
        <button className="adm-rv-ok" onClick={save} disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
        <Link className="adm-fm-link" to="/admin/formulaires">Annuler</Link>
      </div>
    </div>
  )
}