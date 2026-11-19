/**
 * @file server.js
 * @layer Core Delivery Runtime - Studio B2.st
 * @description وب‌سرور ایمن‌سازی شده با CSP، Helmet و متصل به config/env_config.js
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { Config } from './config/env_config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ۱. تنظیم سیاست‌های امنیتی هدرها (Content Security Policy) برای بازی ماریو
app.use(
  helmet({
    contentSecurityPolicy: {
      reportOnly: Config.security.cspReportOnly,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // unsafe-inline فقط برای منطق‌های تک‌فایلی HTML ماریو
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        mediaSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", 'data:'],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: Config.isProduction ? [] : null
      }
    },
    crossOriginEmbedderPolicy: false
  })
);

// ۲. اعمال CORS محدود بر اساس لیست سفید
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || Config.security.allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Blocked by B2.st CORS Security Policy'));
      }
    },
    methods: ['GET', 'HEAD']
  })
);

// ۳. محدودساز نرخ درخواست (Anti-DDoS / Rate Limiter)
const limiter = rateLimit({
  windowMs: Config.security.rateLimit.windowMs,
  max: Config.security.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' }
});
app.use(limiter);

// ۴. سرو فایل‌های استاتیک بازی (شامل index.html ماریو)
const staticPath = path.resolve(__dirname, Config.server.assetsDir);
app.use(
  express.static(staticPath, {
    dotfiles: 'ignore',
    etag: true,
    extensions: ['html', 'htm', 'js', 'css', 'png', 'ogg', 'mp3'],
    index: ['index.html'],
    maxAge: Config.isProduction ? '1d' : '0'
  })
);

// Fallback ایمن
app.use((req, res) => {
  res.status(404).send('Security Audit: Asset or Resource Not Found.');
});

// راه‌اندازی سرور
app.listen(Config.server.port, Config.server.host, () => {
  console.log(`[B2.st Security Node] Mario Game Engine is securely listening on: http://${Config.server.host}:${Config.server.port}`);
  console.log(`[B2.st Security Node] Operating Mode: ${Config.env.toUpperCase()}`);
});