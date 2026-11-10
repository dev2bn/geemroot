import { Router } from 'express';
import pool from '../db.js';

const router = Router();

const hits = new Map();
function limiter(req, res, next) {
  const now = Date.now();
  const recent = (hits.get(req.ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  if (recent.length >= 5) {
    return res.status(429).json({ error: "Trop d'avis envoyés, réessayez plus tard" });
  }
  recent.push(now);
  hits.set(req.ip, recent);
  next();
}

// Avis validés d'un produit
router.get('/:productId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, author_name, content, created_at
       FROM comments
       WHERE product_id = $1 AND is_approved = true
       ORDER BY created_at DESC`,
      [req.params.productId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Envoi d'un avis (en attente de validation)
router.post('/', limiter, async (req, res) => {
  const product_id = Number(req.body.product_id);
  const author_name = String(req.body.author_name || '').trim();
  const content = String(req.body.content || '').trim();

  if (!product_id || !author_name || !content) {
    return res.status(400).json({ error: 'Nom et commentaire obligatoires' });
  }
  if (author_name.length > 60) {
    return res.status(400).json({ error: 'Nom trop long (60 caractères max)' });
  }
  if (content.length > 1000) {
    return res.status(400).json({ error: 'Commentaire trop long (1000 caractères max)' });
  }

  try {
    const exists = await pool.query('SELECT 1 FROM products WHERE id = $1', [product_id]);
    if (exists.rows.length === 0) {
      return res.status(404).json({ error: 'Produit introuvable' });
    }
    await pool.query(
      'INSERT INTO comments (product_id, author_name, content) VALUES ($1, $2, $3)',
      [product_id, author_name, content]
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;