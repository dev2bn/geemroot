import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db.js';
import productsRouter from './routes/products.js';
import zonesRouter from './routes/zones.js';
import ordersRouter from './routes/orders.js';
import adminRoutes from './routes/admin.js';
import uploadRoutes, { UPLOAD_DIR } from './routes/upload.js';
import ordersRoutes from './routes/orders.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/products', productsRouter);
app.use('/api/zones', zonesRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/admin', adminRoutes);
app.use('/api/uploads', express.static(UPLOAD_DIR));
app.use('/api/admin/upload', uploadRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/uploads', express.static(UPLOAD_DIR));
app.use('/api/admin/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ ok: true, time: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

   const PORT = process.env.PORT || 5000
   app.listen(PORT, () => console.log(`Serveur lancé sur ${PORT}`))