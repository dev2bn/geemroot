import { Router } from 'express';
import pool from '../db.js';

const router = Router();
const fail = (res, err) => { console.error(err); res.status(500).json({ error: 'Erreur serveur' }); };
const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '');

router.put('/products/:id/cost', async (req, res) => {
  const cost = Number(req.body.cost_price);
  if (!Number.isFinite(cost) || cost < 0) return res.status(400).json({ error: "Prix d'achat invalide" });
  try {
    const r = await pool.query('UPDATE products SET cost_price = $1 WHERE id = $2 RETURNING id', [cost, req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Produit introuvable' });
    res.json({ ok: true });
  } catch (err) { fail(res, err); }
});

router.get('/stock', async (req, res) => {
  try {
    const r = await pool.query('SELECT id, name, stock, cost_price, price FROM products WHERE is_active = true ORDER BY name');
    res.json(r.rows);
  } catch (err) { fail(res, err); }
});

router.get('/stock/movements', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT m.id, m.quantity, m.reason, m.order_id, m.note, m.created_at, p.name AS product_name
       FROM stock_movements m LEFT JOIN products p ON p.id = m.product_id
       ORDER BY m.id DESC LIMIT 100`
    );
    res.json(r.rows);
  } catch (err) { fail(res, err); }
});

router.post('/stock/move', async (req, res) => {
  const pid = parseInt(req.body.product_id, 10);
  const qty = parseInt(req.body.quantity, 10);
  const reason = req.body.reason === 'ajustement' ? 'ajustement' : 'entree';
  const unitCost = Number(req.body.unit_cost);
  const note = (req.body.note || '').trim() || null;
  if (!pid || !qty) return res.status(400).json({ error: 'Produit et quantité requis' });
  if (reason === 'entree' && qty < 0) return res.status(400).json({ error: 'Une entrée doit être positive' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const p = await client.query('SELECT stock FROM products WHERE id = $1 AND is_active = true FOR UPDATE', [pid]);
    if (!p.rows.length) throw { status: 404, message: 'Produit introuvable' };
    if (p.rows[0].stock + qty < 0) throw { status: 400, message: 'Stock insuffisant pour cet ajustement' };
    await client.query('UPDATE products SET stock = stock + $1 WHERE id = $2', [qty, pid]);
    await client.query('INSERT INTO stock_movements (product_id, quantity, reason, note) VALUES ($1, $2, $3, $4)', [pid, qty, reason, note]);
    if (reason === 'entree' && unitCost > 0) {
      await client.query('UPDATE products SET cost_price = $1 WHERE id = $2', [unitCost, pid]);
    }
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.status) return res.status(err.status).json({ error: err.message });
    fail(res, err);
  } finally { client.release(); }
});

router.get('/accounting/summary', async (req, res) => {
  const { from, to } = req.query;
  if (!isDate(from) || !isDate(to)) return res.status(400).json({ error: 'Période invalide' });
  try {
    const e = await pool.query(
      `SELECT a.id, a.order_id, a.type, a.revenue, a.delivery_fee, a.cogs, a.margin, a.created_at, o.customer_name
       FROM accounting_entries a LEFT JOIN orders o ON o.id = a.order_id
       WHERE (a.created_at AT TIME ZONE 'Africa/Libreville')::date BETWEEN $1 AND $2
       ORDER BY a.id DESC`, [from, to]);
    const x = await pool.query(
      `SELECT id, label, category, amount, expense_date FROM expenses
       WHERE expense_date BETWEEN $1 AND $2 ORDER BY expense_date DESC, id DESC`, [from, to]);
    const sum = (rows, k) => rows.reduce((s, r) => s + Number(r[k]), 0);
    const revenue = sum(e.rows, 'revenue');
    const cogs = sum(e.rows, 'cogs');
    const margin = sum(e.rows, 'margin');
    const expenses = sum(x.rows, 'amount');
    res.json({
      revenue, delivery_fee: sum(e.rows, 'delivery_fee'), cogs, margin, expenses,
      profit: margin - expenses,
      orders_count: e.rows.filter((r) => r.type === 'vente').length - e.rows.filter((r) => r.type === 'annulation').length,
      entries: e.rows, expenses_list: x.rows,
    });
  } catch (err) { fail(res, err); }
});

router.post('/expenses', async (req, res) => {
  const label = (req.body.label || '').trim();
  const amount = Number(req.body.amount);
  const date = isDate(req.body.expense_date) ? req.body.expense_date : null;
  if (!label || !Number.isFinite(amount) || amount <= 0) return res.status(400).json({ error: 'Libellé et montant requis' });
  try {
    const r = await pool.query(
      'INSERT INTO expenses (label, category, amount, expense_date) VALUES ($1, $2, $3, COALESCE($4::date, CURRENT_DATE)) RETURNING *',
      [label, (req.body.category || '').trim() || null, amount, date]);
    res.status(201).json(r.rows[0]);
  } catch (err) { fail(res, err); }
});

router.delete('/expenses/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM expenses WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { fail(res, err); }
});

export default router;