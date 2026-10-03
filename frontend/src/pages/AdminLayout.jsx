import { useEffect, useState } from 'react'
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom'

export default function AdminLayout() {
  const [key, setKey] = useState(localStorage.getItem('adminKey') || '')
  const [input, setInput] = useState('')
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  // ferme le menu à chaque changement de page
  useEffect(() => setOpen(false), [pathname])

  function submit(e) {
    e.preventDefault()
    localStorage.setItem('adminKey', input)
    setKey(input)
  }

  function logout() {
    localStorage.removeItem('adminKey')
    setKey('')
  }

  if (!key) {
    return (
      <form onSubmit={submit} className="adm-login">
        <h2>Accès vendeuse</h2>
        <input
          type="password"
          placeholder="Clé admin"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="pd-btn-dark">Entrer</button>
      </form>
    )
  }

  return (
    <div className="adl">
      <header className="adl-top">
        <button className="adl-burger" onClick={() => setOpen(true)} aria-label="Ouvrir le menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
        <Link to="/admin" className="adl-top-logo">Geem · Admin</Link>
      </header>

      {open && <div className="adl-overlay" onClick={() => setOpen(false)} />}

      <aside className={`adl-side ${open ? 'open' : ''}`}>
        <button className="adl-close" onClick={() => setOpen(false)} aria-label="Fermer le menu">✕</button>
        <Link to="/admin" className="adl-logo">Geem · Admin</Link>
        <nav>
          <NavLink to="/admin" end>Commandes</NavLink>
          <NavLink to="/admin/produits" end>Produits</NavLink>
          <NavLink to="/admin/produits/nouveau">+ Nouveau produit</NavLink>
          <NavLink to="/admin/rubriques">Rubriques</NavLink>
          <NavLink to="/admin/clients">Clients</NavLink>
        </nav>
        <div className="adl-foot">
          <Link to="/">← Voir la boutique</Link>
          <button onClick={logout}>Déconnexion</button>
        </div>
      </aside>

      <section className="adl-content">
        <Outlet />
      </section>
    </div>
  )
}