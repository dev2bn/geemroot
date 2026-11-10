import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'

const headers = () => ({ 'x-admin-key': localStorage.getItem('adminKey') || '' })
const toArr = (v) => (v === undefined || v === null ? [] : Array.isArray(v) ? v : [v])

function Bar({ label, count, total }) {
  const pct = total ? Math.round((count / total) * 100) : 0
  return (
    <div className="adm-fm-bar-row">
      <span className="adm-fm-bar-label">{label}</span>
      <div className="adm-fm-bar-track"><div className="adm-fm-bar-fill" style={{ width: `${pct}%` }} /></div>
      <span className="adm-fm-bar-val">{pct}% ({count})</span>
    </div>
  )
}

function Stats({ q, responses }) {
  const values = responses.map((r) => r.answers?.[q.id]).filter((v) => v !== undefined && v !== null && v !== '')
  const total = responses.length

  if (['single', 'multi', 'select', 'yesno'].includes(q.type)) {
    const opts = q.type === 'yesno' ? ['Oui', 'Non'] : q.options
    return opts.map((o) => (
      <Bar key={o} label={o} total={total} count={values.filter((v) => toArr(v).includes(o)).length} />
    ))
  }
  if (q.type === 'rating') {
    const nums = values.map(Number).filter((n) => n > 0)
    const avg = nums.length ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1) : '-'
    return (
      <>
        <p className="adm-fm-avg">Moyenne : {avg} / 5</p>
        {[5, 4, 3, 2, 1].map((n) => (
          <Bar key={n} label={`${n} ★`} total={total} count={nums.filter((x) => x === n).length} />
        ))}
      </>
    )
  }
  if (q.type === 'number') {
    const nums = values.map(Number).filter((n) => !Number.isNaN(n))
    if (!nums.length) return <p className="adm-rv-empty">Aucune réponse.</p>
    const avg = (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1)
    return <p className="adm-fm-avg">Moyenne : {avg} · Min : {Math.min(...nums)} · Max : {Math.max(...nums)}</p>
  }
  if (!values.length) return <p className="adm-rv-empty">Aucune réponse.</p>
  return (
    <ul className="adm-fm-texts">
      {values.map((v, i) => <li key={i}>{String(v)}</li>)}
    </ul>
  )
}

export default function AdminFormResults() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [view, setView] = useState('stats')

  const load = () =>
    fetch(`/api/admin/forms/${id}/results`, { headers: headers() })
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!ok) throw new Error(d.error || 'Erreur')
        setData(d)
      })
      .catch((err) => setError(err.message))

  useEffect(() => { load() }, [id])

  const removeResponse = async (rid) => {
    if (!window.confirm('Supprimer cette réponse ?')) return
    const res = await fetch(`/api/admin/forms/${id}/responses/${rid}`, { method: 'DELETE', headers: headers() })
    if (res.ok) load()
  }

  if (error) return <p className="error">{error}</p>
  if (!data) return <p className="adm-rv-empty">Chargement...</p>

  const { form, questions, responses } = data
  const show = (v) => (Array.isArray(v) ? v.join(', ') : String(v))

  return (
    <div className="adm-fm">
      <Link to="/admin/formulaires" className="adm-fm-link">← Formulaires</Link>
      <h1 className="adm-rv-title">
        {form.title} <span className="adm-rv-count">{responses.length}</span>
      </h1>

      <div className="adm-rv-actions" style={{ marginBottom: 12 }}>
        <button className={view === 'stats' ? 'adm-rv-ok' : 'adm-fm-link'} onClick={() => setView('stats')}>Par question</button>
        <button className={view === 'list' ? 'adm-rv-ok' : 'adm-fm-link'} onClick={() => setView('list')}>Réponses</button>
      </div>

      {responses.length === 0 && <p className="adm-rv-empty">Aucune réponse pour le moment.</p>}

      {responses.length > 0 && view === 'stats' && questions.map((q) => (
        <div key={q.id} className="adm-rv-card adm-fm-box">
          <strong>{q.label}</strong>
          <Stats q={q} responses={responses} />
        </div>
      ))}

      {responses.length > 0 && view === 'list' && responses.map((r) => (
        <div key={r.id} className="adm-rv-card adm-fm-box">
          <span className="adm-rv-meta">{new Date(r.created_at).toLocaleString('fr-FR')}</span>
          {questions.map((q) => {
            const v = r.answers?.[q.id]
            if (v === undefined) return null
            return <p key={q.id} className="adm-rv-text"><strong>{q.label}</strong><br />{show(v)}</p>
          })}
          <button className="adm-rv-del adm-fm-small" onClick={() => removeResponse(r.id)}>Supprimer</button>
        </div>
      ))}
    </div>
  )
}