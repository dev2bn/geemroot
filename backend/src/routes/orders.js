import { Router } from 'express';
import pool from '../db.js';

const router = Router();

const STATUSES = ['nouvelle', 'confirmée', 'livrée', 'annulée'];

function requireAdmin(req, res, next) {
  if (!process.env.ADMIN_KEY || req.headers['x-admin-key'] !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Accès refusé' });
  }
  next();
}

// Créer une commande (public)
router.post('/', async (req, res) => {
  const { customer_name, phone, email, address, zone_id, items } = req.body;

  if (!customer_name || !phone || !email || !address) {
    return res.status(400).json({ error: 'Champs manquants' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Panier vide' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Zone optionnelle : si absente, livraison à confirmer (frais = 0)
    let zone = null;
    let deliveryFee = 0;
    if (zone_id) {
      const zoneRes = await client.query(
        'SELECT id, name, fee FROM delivery_zones WHERE id = $1 AND is_active = true',
        [zone_id]
      );
      if (zoneRes.rows.length === 0) {
        throw { status: 400, message: 'Zone de livraison invalide' };
      }
      zone = zoneRes.rows[0];
      deliveryFee = Number(zone.fee);
    }

    // Produits : prix et stock vérifiés côté serveur
    let subtotal = 0;
    const lines = [];
    for (const item of items) {
      const qty = parseInt(item.quantity, 10);
      if (!qty || qty < 1) {
        throw { status: 400, message: 'Quantité invalide' };
      }
      const pRes = await client.query(
        'SELECT id, name, price, stock FROM products WHERE id = $1 AND is_active = true FOR UPDATE',
        [item.product_id]
      );
      if (pRes.rows.length === 0) {
        throw { status: 400, message: 'Produit introuvable' };
      }
      const p = pRes.rows[0];
      if (p.stock < qty) {
        throw { status: 400, message: `Stock insuffisant pour ${p.name}` };
      }
      const unitPrice = Number(p.price);
      subtotal += unitPrice * qty;
      lines.push({ id: p.id, name: p.name, unitPrice, qty });
    }

    const total = subtotal + deliveryFee;

    const orderRes = await client.query(
      `INSERT INTO orders
        (customer_name, phone, email, address, zone_id, zone_name, subtotal, delivery_fee, total)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        customer_name, phone, email, address,
        zone ? zone.id : null,
        zone ? zone.name : null,
        subtotal, deliveryFee, total,
      ]
    );
    const orderId = orderRes.rows[0].id;

    for (const l of lines) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, l.id, l.name, l.unitPrice, l.qty]
      );
      await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [l.qty, l.id]);
    }

    await client.query('COMMIT');

    // Lien WhatsApp avec message prérempli
    const cur = process.env.CURRENCY || '';
    const adminUrl = `${process.env.FRONTEND_URL}/admin/commande/${orderId}`;
    const message =
      `🛒 *Nouvelle commande n°${orderId}*\n` +
      `${customer_name} : ${total} ${cur}\n\n` +
      `👉 Voir la commande :\n${adminUrl}`;
    const whatsappUrl = `https://wa.me/${process.env.WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

    res.status(201).json({ orderId, subtotal, deliveryFee, total, whatsappUrl });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    client.release();
  }
});

// Liste des commandes (admin)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const result = status
      ? await pool.query('SELECT * FROM orders WHERE status = $1 ORDER BY id DESC', [status])
      : await pool.query('SELECT * FROM orders ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Détail d'une commande (admin)
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const orderRes = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    if (orderRes.rows.length === 0) {
      return res.status(404).json({ error: 'Commande introuvable' });
    }
    const itemsRes = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [req.params.id]);
    res.json({ ...orderRes.rows[0], items: itemsRes.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Changer le statut (admin)
router.patch('/:id/status', requireAdmin, async (req, res) => {
  const { status } = req.body;
  if (!STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Statut invalide' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const cur = await client.query('SELECT status FROM orders WHERE id = $1 FOR UPDATE', [req.params.id]);
    if (cur.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Commande introuvable' });
    }
    const oldStatus = cur.rows[0].status;

    // Annulation : on remet le stock
    if (status === 'annulée' && oldStatus !== 'annulée') {
      const items = await client.query(
        'SELECT product_id, quantity FROM order_items WHERE order_id = $1',
        [req.params.id]
      );
      for (const it of items.rows) {
        await client.query('UPDATE products SET stock = stock + $1 WHERE id = $2', [it.quantity, it.product_id]);
      }
    }
    // Réactivation d'une commande annulée : on retire à nouveau le stock
    if (oldStatus === 'annulée' && status !== 'annulée') {
      const items = await client.query(
        'SELECT product_id, quantity FROM order_items WHERE order_id = $1',
        [req.params.id]
      );
      for (const it of items.rows) {
        await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [it.quantity, it.product_id]);
      }
    }

    const upd = await client.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    await client.query('COMMIT');
    res.json(upd.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    client.release();
  }
});

export default router;