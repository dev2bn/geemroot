import { Router } from 'express'
import pool from '../db.js'

const router = Router()
export const adminSettingsRouter = Router()

pool.query('CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)')
  .catch((e) => console.error('settings:', e.message))

async function read() {
  const r = await pool.query('SELECT key, value FROM settings')
  const out = { logo_text: 'Geem', hero_image: '' }
  r.rows.forEach((x) => { out[x.key] = x.value })
  return out
}

function requireAdmin(req, res, next) {
  if (!process.env.ADMIN_KEY || req.headers['x-admin-key'] !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Accès refusé' })
  }
  next()
}

router.get('/', async (req, res) => {
  try { res.json(await read()) }
  catch (err) { console.error(err); res.status(500).json({ error: 'Erreur serveur' }) }
})

adminSettingsRouter.put('/', requireAdmin, async (req, res) => {
  try {
    const logo = String(req.body.logo_text || '').trim().slice(0, 40) || 'Geem'
    const hero = String(req.body.hero_image || '').trim().slice(0, 500)
    for (const [k, v] of [['logo_text', logo], ['hero_image', hero]]) {
      await pool.query(
        'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value',
        [k, v]
      )
    }
    res.json(await read())
  } catch (err) { console.error(err); res.status(500).json({ error: 'Erreur serveur' }) }
})

export default router