/**
 * B2.st Mario Engine - Server & Management Configuration
 * Centralized configuration for CLI, HTTP server, and Health Monitoring subsystem.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

export const ServerConfig = {
  // Server Network Bindings
  server: {
    host: process.env.HOST || '127.0.0.1',
    port: parseInt(process.env.PORT || '3000', 10),
    cors: {
      origin: '*',
      methods: 'GET, HEAD, OPTIONS',
      headers: 'Content-Type, Authorization, X-Requested-With'
    }
  },

  // Directory Locations
  paths: {
    root: ROOT_DIR,
    public: path.resolve(ROOT_DIR, 'public'),
    src: path.resolve(ROOT_DIR, 'src'),
    levels: path.resolve(ROOT_DIR, 'src/levels'),
    tests: path.resolve(ROOT_DIR, 'tests')
  },

  // Health Monitor and Alert Thresholds
  health: {
    serviceName: 'b2st-mario-engine',
    version: '1.0.0',
    sampleIntervalMs: 1000,
    thresholds: {
      // Memory warning threshold: 85% of heap used
      heapWarningRatio: 0.85,
      // Maximum acceptable event-loop lag in milliseconds
      eventLoopLagWarningMs: 120,
      // Disk read latency threshold in milliseconds
      storageLatencyWarningMs: 250
    },
    endpoints: {
      health: '/health',
      liveness: '/health/liveness',
      readiness: '/health/readiness',
      metrics: '/metrics'
    }
  },

  // Static File Server Settings
  staticServer: {
    defaultIndex: 'index.html',
    cacheControl: {
      staticAssets: 'public, max-age=3600, must-revalidate',
      dynamic: 'no-cache, no-store, must-revalidate'
    },
    mimeTypes: {
      '.html': 'text/html; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.mjs': 'application/javascript; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.wav': 'audio/wav',
      '.mp3': 'audio/mpeg',
      '.ogg': 'audio/ogg',
      '.ico': 'image/x-icon'
    }
  }
};

export default ServerConfig;