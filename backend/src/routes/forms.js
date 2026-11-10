import { Router } from 'express';
import pool from '../db.js';

const router = Router();

const hits = new Map();
function limiter(req, res, next) {
  const now = Date.now();
  const recent = (hits.get(req.ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  if (recent.length >= 10) {
    return res.status(429).json({ error: 'Trop de réponses envoyées, réessayez plus tard' });
  }
  recent.push(now);
  hits.set(req.ip, recent);
  next();
}

// Formulaire actif (avec ses questions)
router.get('/active', async (req, res) => {
  try {
    const f = await pool.query('SELECT id, title, banner_text FROM forms WHERE is_active = true LIMIT 1');
    if (f.rows.length === 0) return res.json(null);
    const q = await pool.query(
      `SELECT id, step, type, label, options, required
       FROM form_questions WHERE form_id = $1
       ORDER BY step, position, id`,
      [f.rows[0].id]
    );
    res.json({ ...f.rows[0], questions: q.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Envoi d'une réponse
router.post('/:id/responses', limiter, async (req, res) => {
  try {
    const formId = Number(req.params.id);
    const f = await pool.query('SELECT id FROM forms WHERE id = $1 AND is_active = true', [formId]);
    if (f.rows.length === 0) return res.status(404).json({ error: 'Formulaire indisponible' });

    const q = await pool.query('SELECT id, label, required FROM form_questions WHERE form_id = $1', [formId]);
    const input = req.body.answers && typeof req.body.answers === 'object' ? req.body.answers : {};
    const clean = {};

    for (const question of q.rows) {
      let v = input[question.id];
      if (Array.isArray(v)) v = v.map((x) => String(x).slice(0, 500)).slice(0, 50);
      else if (v !== undefined && v !== null) v = String(v).slice(0, 2000);
      const empty = v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);
      if (empty) {
        if (question.required) return res.status(400).json({ error: `Question obligatoire : ${question.label}` });
        continue;
      }
      clean[question.id] = v;
    }

    await pool.query('INSERT INTO form_responses (form_id, answers) VALUES ($1, $2)', [formId, JSON.stringify(clean)]);
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;