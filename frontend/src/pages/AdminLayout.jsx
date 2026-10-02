import { useState } from 'react'
import { NavLink, Outlet, Link } from 'react-router-dom'

export default function AdminLayout() {
  const [key, setKey] = useState(localStorage.getItem('adminKey') || '')
  const [input, setInput] = useState('')

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
      <aside className="adl-side">
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