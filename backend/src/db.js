   import 'dotenv/config'
   import pg from 'pg'

   const pool = new pg.Pool({
     connectionString: process.env.DATABASE_URL,
     max: 5,
     idleTimeoutMillis: 10000,
     connectionTimeoutMillis: 15000,
     keepAlive: true,
   })

   pool.on('error', (err) => console.error('Erreur pool pg:', err.message))

   export default pool