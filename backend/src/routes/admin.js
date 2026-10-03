import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.use((req, res, next) => {
  if (!process.env.ADMIN_KEY || req.headers['x-admin-key'] !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Accès refusé' });
  }
  next();
});

function slugify(text) {
  return (
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'produit'
  );
}

async function uniqueSlug(name) {
  const base = slugify(name);
  let slug = base;
  let n = 2;
  while ((await pool.query('SELECT 1 FROM products WHERE slug = $1', [slug])).rows.length > 0) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

async function resolveCategory(id) {
  if (!id) return { id: null, name: null };
  const r = await pool.query('SELECT id, name FROM categories WHERE id = $1', [id]);
  return r.rows[0] || null;
}

function parseProduct(body) {
  const name = (body.name || '').trim();
  const price = Number(body.price);
  const stock = parseInt(body.stock, 10);
  if (!name) return { error: 'Nom requis' };
  if (!Number.isFinite(price) || price < 0) return { error: 'Prix invalide' };
  if (!Number.isInteger(stock) || stock < 0) return { error: 'Stock invalide' };
  const txt = (v) => (v || '').trim() || null;
  return {
    value: {
      name,
      description: body.description || '',
      price,
      stock,
      category_id: parseInt(body.category_id, 10) || null,
      image_url: (body.image_url || '').trim() || null,
      usage_text: txt(body.usage_text),
      benefits_text: txt(body.benefits_text),
      ingredients_text: txt(body.ingredients_text),
    },
  };
}

/* ---------- Produits ---------- */

router.get('/products', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM products WHERE is_active = true ORDER BY id');
    res.json(r.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/products/:id', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM products WHERE id = $1 AND is_active = true', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Produit introuvable' });
    res.json(r.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/products', async (req, res) => {
  const { value, error } = parseProduct(req.body);
  if (error) return res.status(400).json({ error });
  try {
    const cat = await resolveCategory(value.category_id);
    if (!cat) return res.status(400).json({ error: 'Rubrique invalide' });
    const slug = await uniqueSlug(value.name);
    const r = await pool.query(
      `INSERT INTO products
         (name, slug, description, price, stock, category, category_id, image_url, is_active,
          usage_text, benefits_text, ingredients_text)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9, $10, $11) RETURNING *`,
      [value.name, slug, value.description, value.price, value.stock, cat.name, cat.id, value.image_url,
       value.usage_text, value.benefits_text, value.ingredients_text]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/products/:id', async (req, res) => {
  const { value, error } = parseProduct(req.body);
  if (error) return res.status(400).json({ error });
  try {
    const cat = await resolveCategory(value.category_id);
    if (!cat) return res.status(400).json({ error: 'Rubrique invalide' });
    const r = await pool.query(
      `UPDATE products
       SET name = $1, description = $2, price = $3, stock = $4, category = $5, category_id = $6, image_url = $7,
           usage_text = $8, benefits_text = $9, ingredients_text = $10
       WHERE id = $11 AND is_active = true RETURNING *`,
      [value.name, value.description, value.price, value.stock, cat.name, cat.id, value.image_url,
       value.usage_text, value.benefits_text, value.ingredients_text, req.params.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Produit introuvable' });
    res.json(r.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/products/:id', async (req, res) => {
  try {
    const r = await pool.query('UPDATE products SET is_active = false WHERE id = $1 RETURNING id', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Produit introuvable' });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/* ---------- Rubriques ---------- */

router.get('/categories', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT c.id, c.name, COUNT(p.id) FILTER (WHERE p.is_active)::int AS products_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id
       GROUP BY c.id
       ORDER BY c.name`
    );
    res.json(r.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/categories', async (req, res) => {
  const name = (req.body.name || '').trim();
  if (!name) return res.status(400).json({ error: 'Nom requis' });
  try {
    const r = await pool.query('INSERT INTO categories (name) VALUES ($1) RETURNING id, name', [name]);
    res.status(201).json({ ...r.rows[0], products_count: 0 });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Cette rubrique existe déjà' });
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/categories/:id', async (req, res) => {
  const name = (req.body.name || '').trim();
  if (!name) return res.status(400).json({ error: 'Nom requis' });
  try {
    const r = await pool.query('UPDATE categories SET name = $1 WHERE id = $2 RETURNING id, name', [name, req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Rubrique introuvable' });
    await pool.query('UPDATE products SET category = $1 WHERE category_id = $2', [name, req.params.id]);
    res.json(r.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Cette rubrique existe déjà' });
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/categories/:id', async (req, res) => {
  try {
    await pool.query('UPDATE products SET category = NULL WHERE category_id = $1', [req.params.id]);
    const r = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING id', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Rubrique introuvable' });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Assigner des produits à une rubrique (remplace la sélection actuelle)
router.put('/categories/:id/products', async (req, res) => {
  const ids = Array.isArray(req.body.product_ids)
    ? req.body.product_ids.map(Number).filter(Number.isInteger)
    : [];
  const client = await pool.connect();
  try {
    const cat = await client.query('SELECT id, name FROM categories WHERE id = $1', [req.params.id]);
    if (cat.rows.length === 0) return res.status(404).json({ error: 'Rubrique introuvable' });

    await client.query('BEGIN');
    await client.query(
      'UPDATE products SET category_id = NULL, category = NULL WHERE category_id = $1 AND NOT (id = ANY($2::int[]))',
      [req.params.id, ids]
    );
    await client.query(
      'UPDATE products SET category_id = $1, category = $3 WHERE id = ANY($2::int[])',
      [req.params.id, ids, cat.rows[0].name]
    );
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

/* ---------- Clients ---------- */

router.get('/customers', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT regexp_replace(phone, '\\D', '', 'g') AS key,
              (array_agg(phone ORDER BY id DESC))[1] AS phone,
              (array_agg(customer_name ORDER BY id DESC))[1] AS customer_name,
              (array_agg(email ORDER BY id DESC))[1] AS email,
              (array_agg(address ORDER BY id DESC))[1] AS address,
              COUNT(*)::int AS orders_count,
              COALESCE(SUM(total) FILTER (WHERE status <> 'annulée'), 0) AS total_spent,
              MAX(created_at) AS last_order
       FROM orders
       GROUP BY regexp_replace(phone, '\\D', '', 'g')
       ORDER BY MAX(created_at) DESC`
    );
    res.json(r.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/customers/:key', async (req, res) => {
  const key = String(req.params.key).replace(/\D/g, '');
  if (!key) return res.status(400).json({ error: 'Client invalide' });
  try {
    const r = await pool.query(
      `SELECT id, customer_name, phone, email, address, status, total, created_at
       FROM orders
       WHERE regexp_replace(phone, '\\D', '', 'g') = $1
       ORDER BY created_at DESC`,
      [key]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Client introuvable' });
    const latest = r.rows[0];
    const total_spent = r.rows
      .filter((o) => o.status !== 'annulée')
      .reduce((s, o) => s + Number(o.total), 0);
    res.json({
      customer: {
        customer_name: latest.customer_name,
        phone: latest.phone,
        email: latest.email,
        address: latest.address,
        orders_count: r.rows.length,
        total_spent,
      },
      orders: r.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;