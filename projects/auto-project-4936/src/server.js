```js
/**
 * ═══════════════════════════════════════
 *  LinkBox — Smart URL Shortener
 *  Main Server Entry Point
 * ═══════════════════════════════════════
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

const config = require('./config');
const { migrate } = require('./db/migrate');
const errorHandler = require('./middleware/errorHandler');

// ─── Run migrations on startup ───
migrate();

// ─── Create Express App ───
const app = express();

// ─── Global Middleware ───
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

// ─── API Routes ───
const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

// ─── Health Check ───
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      service: 'LinkBox',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    },
  });
});

// ─── Serve Static Files (SPA) ───
app.use(express.static(path.join(__dirname, '..', 'public')));

// ─── SPA Fallback (serve index.html for non-API routes) ───
app.get('*', (req, res, next) => {
  // Don't catch API routes or short-code redirects (will be added later)
  if (req.path.startsWith('/auth') || req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// ─── Global Error Handler ───
app.use(errorHandler);

// ─── Start Server ───
const server = app.listen(config.port, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════╗');
  console.log('  ║        🔗 LinkBox is running!        ║');
  console.log('  ╠══════════════════════════════════════╣');
  console.log(`  ║  URL:  http://localhost:${config.port}          ║`);
  console.log(`  ║  ENV:  ${config.nodeEnv.padEnd(27)}║`);
  console.log(`  ║  DB:   ${config.dbPath.padEnd(27)}║`);
  console.log('  ╚══════════════════════════════════════╝');
  console.log('');
});

module.exports = { app, server };
```