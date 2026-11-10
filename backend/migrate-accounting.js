try { await import('dotenv/config') } catch {}
const { default: pool } = await import('./src/db.js')

await pool.query(`
  ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price NUMERIC(14,2) NOT NULL DEFAULT 0;
  ALTER TABLE order_items ADD COLUMN IF NOT EXISTS unit_cost NUMERIC(14,2) NOT NULL DEFAULT 0;

  CREATE TABLE IF NOT EXISTS stock_movements (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    reason TEXT NOT NULL,
    order_id INTEGER,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS accounting_entries (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    revenue NUMERIC(14,2) NOT NULL DEFAULT 0,
    delivery_fee NUMERIC(14,2) NOT NULL DEFAULT 0,
    cogs NUMERIC(14,2) NOT NULL DEFAULT 0,
    margin NUMERIC(14,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    label TEXT NOT NULL,
    category TEXT,
    amount NUMERIC(14,2) NOT NULL,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
`)
console.log('MIGRATION OK')
await pool.end()
process.exit(0)