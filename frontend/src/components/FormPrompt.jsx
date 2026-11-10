import { useEffect, useState } from 'react'

const empty = (v) => v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)

export default function FormPrompt() {
  const [form, setForm] = useState(null)
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    fetch('/api/forms/active')
      .then((r) => r.json())
      .then((f) => {
        if (!f || !f.id) return
        let seen = false
        try { seen = localStorage.getItem('formDone') === String(f.id) } catch (e) {}
        if (!seen) setForm(f)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!form) return null

  const keys = [...new Set(form.questions.map((q) => q.step))].sort((a, b) => a - b)
  const current = form.questions.filter((q) => q.step === keys[step])
  const last = step === keys.length - 1
  const set = (id, v) => setAnswers((a) => ({ ...a, [id]: v }))

  const validate = () => {
    for (const q of current) {
      if (q.required && empty(answers[q.id])) {
        setError('Merci de répondre aux questions obligatoires.')
        return false
      }
    }
    setError('')
    return true
  }

  const next = () => { if (validate()) setStep(step + 1) }

  const submit = async () => {
    if (!validate()) return
    setSending(true)
    try {
      const clean = {}
      Object.keys(answers).forEach((k) => { if (!empty(answers[k])) clean[k] = answers[k] })
      const res = await fetch(`/api/forms/${form.id}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: clean }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Envoi impossible')
      try { localStorage.setItem('formDone', String(form.id)) } catch (e) {}
      setDone(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  const close = () => {
    setOpen(false)
    if (done) setForm(null)
  }

  const field = (q) => {
    const v = answers[q.id]
    const opts = q.options || []
    if (q.type === 'text') return <input value={v || ''} onChange={(e) => set(q.id, e.target.value)} />
    if (q.type === 'textarea') return <textarea value={v || ''} onChange={(e) => set(q.id, e.target.value)} />
    if (q.type === 'number') return <input type="number" value={v ?? ''} onChange={(e) => set(q.id, e.target.value)} />
    if (q.type === 'select') {
      return (
        <select value={v || ''} onChange={(e) => set(q.id, e.target.value)}>
          <option value="">Choisir...</option>
          {opts.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      )
    }
    if (q.type === 'single') {
      return opts.map((o) => (
        <label key={o} className="fp-opt">
          <input type="radio" name={`q${q.id}`} checked={v === o} onChange={() => set(q.id, o)} /> {o}
        </label>
      ))
    }
    if (q.type === 'multi') {
      const arr = Array.isArray(v) ? v : []
      return opts.map((o) => (
        <label key={o} className="fp-opt">
          <input
            type="checkbox"
            checked={arr.includes(o)}
            onChange={() => set(q.id, arr.includes(o) ? arr.filter((x) => x !== o) : [...arr, o])}
          /> {o}
        </label>
      ))
    }
    if (q.type === 'rating') {
      return (
        <div className="fp-stars">
          {[1, 2, 3, 4, 5].map((n) => (
            <button type="button" key={n} className={Number(v) >= n ? 'on' : ''} onClick={() => set(q.id, n)}>★</button>
          ))}
        </div>
      )
    }
    if (q.type === 'yesno') {
      return (
        <div className="fp-yn">
          {['Oui', 'Non'].map((o) => (
            <button type="button" key={o} className={v === o ? 'on' : ''} onClick={() => set(q.id, o)}>{o}</button>
          ))}
        </div>
      )
    }
    return null
  }

  const text = form.banner_text || form.title

  return (
    <>
      <div className="fp-banner" onClick={() => setOpen(true)}>
        <div className="fp-track">
          <span>{text}</span><span>{text}</span><span>{text}</span><span>{text}</span>
        </div>
      </div>

      <button className="fp-bubble" onClick={() => setOpen(true)} aria-label="Ouvrir le formulaire">?</button>

      {open && (
        <div className="fp-overlay" onClick={close}>
          <div className="fp-modal" onClick={(e) => e.stopPropagation()}>
            <button className="fp-x" onClick={close} aria-label="Fermer">✕</button>
            {done ? (
              <div className="fp-done">
                <h3>Merci !</h3>
                <p>Vos réponses ont bien été envoyées.</p>
                <button className="fp-btn" onClick={close}>Fermer</button>
              </div>
            ) : (
              <>
                <h3>{form.title}</h3>
                <p className="fp-prog">Étape {step + 1} / {keys.length}</p>
                <div className="fp-bar"><div style={{ width: `%` }} /></div>
                {current.map((q) => (
                  <div key={q.id} className="fp-q">
                    <label className="fp-label">{q.label}{q.required && ' *'}</label>
                    {field(q)}
                  </div>
                ))}
                {error && <p className="fp-err">{error}</p>}
                <div className="fp-nav">
                  {step > 0 && <button className="fp-btn fp-ghost" onClick={() => { setError(''); setStep(step - 1) }}>Retour</button>}
                  {last
                    ? <button className="fp-btn" onClick={submit} disabled={sending}>{sending ? 'Envoi...' : 'Envoyer'}</button>
                    : <button className="fp-btn" onClick={next}>Suivant</button>}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}