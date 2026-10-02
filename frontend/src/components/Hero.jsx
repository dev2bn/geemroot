import heroImg from "../assets/products/banner.png";
import { Link } from "react-router-dom";

const perks = [
  { icon: "🌿", title: "100 % naturel", text: "Des huiles sélectionnées pour nourrir le cuir chevelu." },
  { icon: "🚚", title: "Livraison rapide", text: "Livraison dans toute la ville, paiement à la livraison." },
  { icon: "💬", title: "Commande WhatsApp", text: "Commandez en 2 minutes, nous vous confirmons aussitôt." },
];

export default function Hero() {
  return (
    <>
      <section className="hero">
        <img src={heroImg} alt="Huiles capillaires Geem Root" className="hero-bg" />
        <div className="hero-overlay" />
        <div className="hero-text">
          <span className="hero-tag">Geem Root · Premium hair care</span>
          <h1>
            Des cheveux <span className="hl">plus forts</span>, naturellement.
          </h1>
          <p>Huiles de pousse et d'entretien capillaire, livrées chez vous.</p>
          <div className="hero-btns">
            <a href="#produits" className="btn-pill btn-light">Voir les produits</a>
            <Link to="/panier" className="btn-pill btn-outline">Mon panier</Link>
          </div>
        </div>
      </section>

      <section className="perks">
        {perks.map((p) => (
          <div className="perk" key={p.title}>
            <div className="perk-icon">{p.icon}</div>
            <h3>{p.title}</h3>
            <p>{p.text}</p>
          </div>
        ))}
      </section>
    </>
  );
}