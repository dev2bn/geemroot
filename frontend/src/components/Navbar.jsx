import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useCart } from '../cart.jsx'

export default function Navbar() {
  const { count } = useCart()
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  // ferme le menu à chaque changement de page
  useEffect(() => setOpen(false), [pathname])

  // bloque le défilement de la page quand le menu est ouvert
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <header className="header">
        <div className="promo-bar">
          <span>Paiement à la livraison · Livraison dans toute la zone</span>
        </div>
        <div className="header-inner">
          <button className="nav-burger" onClick={() => setOpen(true)} aria-label="Ouvrir le menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>

          <Link to="/" className="logo">Geem</Link>

          <nav className="nav-links">
            <Link to="/">Accueil</Link>
            <Link to="/produits">Produits</Link>
            <a href="/#contact">Contact</a>
          </nav>

          <Link to="/panier" className="cart-link">
            Panier {count > 0 && <span className="cart-badge">{count}</span>}
          </Link>
        </div>
      </header>

      {open && <div className="nav-overlay" onClick={() => setOpen(false)} />}

      <aside className={`nav-drawer ${open ? 'open' : ''}`} aria-hidden={!open}>
        <div className="nav-drawer-head">
          <span className="logo">Geem</span>
          <button className="nav-close" onClick={() => setOpen(false)} aria-label="Fermer le menu">✕</button>
        </div>

        <nav className="nav-drawer-links">
          <NavLink to="/" end>Accueil</NavLink>
          <NavLink to="/produits">Produits</NavLink>
          <a href="/#contact" onClick={() => setOpen(false)}>Contact</a>
          <NavLink to="/panier">
            Mon panier {count > 0 && <span className="cart-badge">{count}</span>}
          </NavLink>
        </nav>

        <p className="nav-drawer-note">Paiement à la livraison</p>
      </aside>
    </>
  )
}