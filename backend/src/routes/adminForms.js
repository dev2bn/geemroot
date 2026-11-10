import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.use((req, res, next) => {
  if (!process.env.ADMIN_KEY || req.headers['x-admin-key'] !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Non autorisé' });
  }
  next();
});

const TYPES = ['text', 'textarea', 'single', 'multi', 'select', 'rating', 'number', 'yesno'];

function validate(body) {
  const title = String(body.title || '').trim();
  if (!title) return { error: 'Titre obligatoire' };
  const questions = Array.isArray(body.questions) ? body.questions : [];
  if (questions.length === 0) return { error: 'Ajoutez au moins une question' };
  const out = [];
  for (const q of questions) {
    const label = String(q.label || '').trim();
    if (!label) return { error: 'Chaque question doit avoir un intitulé' };
    if (!TYPES.includes(q.type)) return { error: 'Type de question invalide' };
    let options = [];
    if (['single', 'multi', 'select'].includes(q.type)) {
      options = (Array.isArray(q.options) ? q.options : []).map((o) => String(o).trim()).filter(Boolean);
      if (options.length < 2) return { error: `Au moins 2 choix pour : ${label}` };
    }
    out.push({
      step: Math.max(1, Number(q.step) || 1),
      type: q.type,
      label,
      options,
      required: !!q.required,
    });
  }
  return { title, banner_text: String(body.banner_text || '').trim(), questions: out };
}

async function saveQuestions(client, formId, questions) {
  await client.query('DELETE FROM form_questions WHERE form_id = $1', [formId]);
  let pos = 0;
  for (const q of questions) {
    await client.query(
      `INSERT INTO form_questions (form_id, step, position, type, label, options, required)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [formId, q.step, pos++, q.type, q.label, JSON.stringify(q.options), q.required]
    );
  }
}

// Liste
router.get('/', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT f.id, f.title, f.banner_text, f.is_active, f.created_at,
              (SELECT COUNT(*) FROM form_responses r WHERE r.form_id = f.id)::int AS responses
       FROM forms f ORDER BY f.created_at DESC`
    );
    res.json(r.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Un formulaire (pour modification)
router.get('/:id', async (req, res) => {
  try {
    const f = await pool.query('SELECT id, title, banner_text, is_active FROM forms WHERE id = $1', [req.params.id]);
    if (f.rows.length === 0) return res.status(404).json({ error: 'Introuvable' });
    const q = await pool.query(
      'SELECT id, step, type, label, options, required FROM form_questions WHERE form_id = $1 ORDER BY step, position, id',
      [req.params.id]
    );
    res.json({ ...f.rows[0], questions: q.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Création
router.post('/', async (req, res) => {
  const v = validate(req.body);
  if (v.error) return res.status(400).json({ error: v.error });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const f = await client.query(
      'INSERT INTO forms (title, banner_text) VALUES ($1, $2) RETURNING id',
      [v.title, v.banner_text]
    );
    await saveQuestions(client, f.rows[0].id, v.questions);
    await client.query('COMMIT');
    res.status(201).json({ id: f.rows[0].id });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    client.release();
  }
});

// Modification (les réponses déjà reçues sont conservées)
router.put('/:id', async (req, res) => {
  const v = validate(req.body);
  if (v.error) return res.status(400).json({ error: v.error });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const f = await client.query(
      'UPDATE forms SET title = $1, banner_text = $2 WHERE id = $3 RETURNING id',
      [v.title, v.banner_text, req.params.id]
    );
    if (f.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Introuvable' });
    }
    await saveQuestions(client, f.rows[0].id, v.questions);
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    client.release();
  }
});

// Activer / désactiver (un seul formulaire actif à la fois)
router.patch('/:id/active', async (req, res) => {
  const active = !!req.body.active;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (active) await client.query('UPDATE forms SET is_active = false WHERE is_active = true');
    await client.query('UPDATE forms SET is_active = $1 WHERE id = $2', [active, req.params.id]);
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    client.release();
  }
});

// Suppression
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM forms WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Résultats : questions, réponses individuelles
router.get('/:id/results', async (req, res) => {
  try {
    const f = await pool.query('SELECT id, title FROM forms WHERE id = $1', [req.params.id]);
    if (f.rows.length === 0) return res.status(404).json({ error: 'Introuvable' });
    const q = await pool.query(
      'SELECT id, step, type, label, options FROM form_questions WHERE form_id = $1 ORDER BY step, position, id',
      [req.params.id]
    );
    const r = await pool.query(
      'SELECT id, answers, created_at FROM form_responses WHERE form_id = $1 ORDER BY created_at DESC',
      [req.params.id]
    );
    res.json({ form: f.rows[0], questions: q.rows, responses: r.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Suppression d'une réponse
router.delete('/:id/responses/:rid', async (req, res) => {
  try {
    await pool.query('DELETE FROM form_responses WHERE id = $1 AND form_id = $2', [req.params.rid, req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;