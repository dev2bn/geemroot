import pool from './src/db.js'

await pool.query(`
  CREATE TABLE IF NOT EXISTS forms (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    banner_text TEXT NOT NULL DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`)
await pool.query(`
  CREATE UNIQUE INDEX IF NOT EXISTS one_active_form ON forms (is_active) WHERE is_active = true
`)
await pool.query(`
  CREATE TABLE IF NOT EXISTS form_questions (
    id SERIAL PRIMARY KEY,
    form_id INTEGER NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    step INTEGER NOT NULL DEFAULT 1,
    position INTEGER NOT NULL DEFAULT 0,
    type TEXT NOT NULL,
    label TEXT NOT NULL,
    options JSONB NOT NULL DEFAULT '[]',
    required BOOLEAN NOT NULL DEFAULT false
  )
`)
await pool.query(`
  CREATE TABLE IF NOT EXISTS form_responses (
    id SERIAL PRIMARY KEY,
    form_id INTEGER NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    answers JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`)

const r = await pool.query(
  "SELECT table_name FROM information_schema.tables WHERE table_name IN ('forms','form_questions','form_responses') ORDER BY 1"
)
console.log('Tables presentes :', r.rows.map((x) => x.table_name).join(', '))
await pool.end()