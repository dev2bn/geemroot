import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <header className="header">
      <div className="promo-bar">
        <span>Paiement à la livraison · Livraison dans toute la zone</span>
      </div>
      <div className="header-inner">
        <Link to="/" className="logo">Geem</Link>
        <nav className="nav-links">
          <Link to="/">Accueil</Link>
          <a href="/#produits">Produits</a>
          <a href="/#contact">Contact</a>
        </nav>
        <Link to="/panier" className="cart-link">
          Panier <span className="cart-badge">0</span>
        </Link>
      </div>
    </header>
  )
}