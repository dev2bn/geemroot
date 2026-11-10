import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.use((req, res, next) => {
  if (!process.env.ADMIN_KEY || req.headers['x-admin-key'] !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Non autorisé' });
  }
  next();
});

// Avis en attente
router.get('/', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT c.id, c.author_name, c.content, c.created_at, p.name AS product_name
       FROM comments c JOIN products p ON p.id = c.product_id
       WHERE c.is_approved = false
       ORDER BY c.created_at DESC`
    );
    res.json(r.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Approuver
router.patch('/:id/approve', async (req, res) => {
  try {
    await pool.query('UPDATE comments SET is_approved = true WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM comments WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;