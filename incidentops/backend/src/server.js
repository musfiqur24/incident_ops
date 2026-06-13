require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const incidentRoutes = require('./routes/incidentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const startReminderJob = require('./utils/reminderJob');

const app = express();
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const ALLOWED_ORIGINS = process.env.CLIENT_URLS ? process.env.CLIENT_URLS.split(',').map(s => s.trim()) : [CLIENT_URL];
const corsOptions = {
  origin: (origin, callback) => {
    // allow requests with no origin (eg. mobile apps, curl)
    if (!origin) return callback(null, true);
    try {
      const url = new URL(origin);
      // accept explicit allowed origins
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      // in non-production, allow any host using the dev port (vite default)
      const isDevPort = url.port === '5173' && process.env.NODE_ENV !== 'production';
      if (isDevPort) return callback(null, true);
    } catch (e) {
      // if parsing fails, deny
    }
    return callback(new Error('CORS_NOT_ALLOWED'));
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Set-Cookie']
};
// Log origin for debug to help with CORS troubleshooting
app.use((req, res, next) => {
  if (req.path === '/api/auth/login') console.debug('Incoming Origin:', req.headers.origin);
  next();
});
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'Reliability Command Center API' }));
app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/notifications', notificationRoutes);

app.use((req, res) => res.status(404).json({ message: 'Route not found.' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server error.' });
});

const PORT = process.env.PORT || 5001;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`API running on port ${PORT}`));
  startReminderJob();
}).catch(err => {
  console.error('Database connection failed:', err.message);
  process.exit(1);
});
