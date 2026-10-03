import { Link } from 'react-router-dom'
import { useCart } from '../cart.jsx'

export default function Navbar() {
  const { count } = useCart()

  return (
    <header className="header">
      <div className="promo-bar">
        <span>Paiement à la livraison · Livraison dans toute la zone</span>
      </div>
      <div className="header-inner">
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
  )
}