require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./config/db');
const fs = require('fs');
const path = require('path');
const { securityHeaders, createRateLimiter } = require('./middleware/security');

const app = express();
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Middleware
app.disable('x-powered-by');
app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : false);
app.use(securityHeaders);
app.use(createRateLimiter({ max: Number(process.env.RATE_LIMIT_MAX) || 300 }));
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/properties', require('./routes/properties'));
app.use('/api/inquiries', require('./routes/inquiries'));

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected', timestamp: new Date() });
  } catch (err) {
    res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: 'Origin not allowed.' });
  }

  console.error(err);
  return res.status(500).json({ message: 'Internal server error.' });
});

// Initialize DB schema
const initDB = async () => {
  try {
    const schema = fs.readFileSync(path.join(__dirname, 'config/schema.sql'), 'utf8');
    await pool.query(schema);
    console.log('✅ Database schema initialized');
  } catch (err) {
    console.error('❌ Schema init error:', err.message);
  }
};

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  if (process.env.NODE_ENV !== 'production' || process.env.AUTO_INIT_DB === 'true') {
    await initDB();
  }
});
