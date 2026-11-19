/**
 * @file src/core/health_monitor.js
 * @description Advanced Real-Time Health and Diagnostics Monitor for Mario ECS Game Engine.
 * Studio: B2.st
 */

import os from 'node:os';
import process from 'node:process';
import { performance } from 'node:perf_hooks';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load health config
const configPath = path.resolve(__dirname, '../../config/health.json');
let healthConfig;
try {
  healthConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (e) {
  healthConfig = {
    serviceName: 'b2st-mario-engine',
    environment: 'development',
    version: '1.4.0',
    thresholds: {
      heapMemoryCriticalPercent: 90,
      heapMemoryWarningPercent: 75,
      eventLoopLagWarningMs: 45,
      eventLoopLagCriticalMs: 120,
      minimumFpsThreshold: 30,
      targetFps: 60
    },
    server: {
      defaultPort: 8080,
      host: '0.0.0.0',
      enableCors: true
    },
    endpoints: {
      health: "/health",
      liveness: "/health/live",
      readiness: "/health/ready",
      telemetry: "/health/telemetry"
    }
  };
}

export const HealthStatus = {
  HEALTHY: 'HEALTHY',
  DEGRADED: 'DEGRADED',
  CRITICAL: 'CRITICAL'
};

export class HealthMonitor {
  constructor(customConfig = {}) {
    this.config = { ...healthConfig, ...customConfig };
    this.startTime = Date.now();
    this.engineMetrics = {
      fps: 60,
      activeEntities: 0,
      renderLagMs: 0,
      physicsStepTimeMs: 0,
      activeLevel: 'World 1-1',
      lastHeartbeat: Date.now()
    };
    this.eventLoopLag = 0;
    this._startLagMonitor();
  }

  /**
   * Samples event loop lag periodically using high-resolution timers.
   */
  _startLagMonitor() {
    let lastCheck = performance.now();
    const interval = 500;

    const timer = setInterval(() => {
      const current = performance.now();
      const delta = current - lastCheck;
      this.eventLoopLag = Math.max(0, delta - interval);
      lastCheck = current;
    }, interval);

    if (timer.unref) {
      timer.unref();
    }
  }

  /**
   * Registers runtime telemetry data reported by the running ECS Mario loop.
   * @param {Object} metrics 
   */
  updateTelemetry(metrics = {}) {
    this.engineMetrics = {
      ...this.engineMetrics,
      ...metrics,
      lastHeartbeat: Date.now()
    };
  }

  /**
   * Analyzes heap memory, loop delays, and system state to determine overall status.
   * @returns {Object} Full diagnostic health report
   */
  getDiagnostics() {
    const mem = process.memoryUsage();
    const heapUsedPercent = Number(((mem.heapUsed / mem.heapTotal) * 100).toFixed(2));
    const uptimeSec = Number(process.uptime().toFixed(2));

    const issues = [];
    let status = HealthStatus.HEALTHY;

    // Memory assessment
    if (heapUsedPercent >= this.config.thresholds.heapMemoryCriticalPercent) {
      status = HealthStatus.CRITICAL;
      issues.push(`Heap memory usage critical: ${heapUsedPercent}%`);
    } else if (heapUsedPercent >= this.config.thresholds.heapMemoryWarningPercent) {
      status = HealthStatus.DEGRADED;
      issues.push(`Heap memory usage elevated: ${heapUsedPercent}%`);
    }

    // Event Loop Lag assessment
    if (this.eventLoopLag >= this.config.thresholds.eventLoopLagCriticalMs) {
      status = HealthStatus.CRITICAL;
      issues.push(`Event loop lag critical: ${this.eventLoopLag.toFixed(2)}ms`);
    } else if (this.eventLoopLag >= this.config.thresholds.eventLoopLagWarningMs) {
      if (status !== HealthStatus.CRITICAL) status = HealthStatus.DEGRADED;
      issues.push(`Event loop lag elevated: ${this.eventLoopLag.toFixed(2)}ms`);
    }

    // ECS Engine FPS assessment
    if (this.engineMetrics.fps < this.config.thresholds.minimumFpsThreshold && this.engineMetrics.fps > 0) {
      if (status !== HealthStatus.CRITICAL) status = HealthStatus.DEGRADED;
      issues.push(`Game engine FPS dropped below threshold: ${this.engineMetrics.fps} FPS`);
    }

    return {
      service: this.config.serviceName,
      version: this.config.version,
      status,
      timestamp: new Date().toISOString(),
      uptimeSeconds: uptimeSec,
      system: {
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        loadAverage: os.loadavg(),
        freeSystemMemoryBytes: os.freemem(),
        totalSystemMemoryBytes: os.totalmem()
      },
      process: {
        pid: process.pid,
        heapUsedBytes: mem.heapUsed,
        heapTotalBytes: mem.heapTotal,
        rssBytes: mem.rss,
        heapUsedPercent,
        eventLoopLagMs: Number(this.eventLoopLag.toFixed(2))
      },
      engineTelemetry: {
        ...this.engineMetrics,
        isEngineResponsive: (Date.now() - this.engineMetrics.lastHeartbeat) < 5000
      },
      issues
    };
  }

  /**
   * Lightweight liveness check probe.
   */
  getLiveness() {
    return {
      status: 'UP',
      uptimeSeconds: Number(process.uptime().toFixed(2)),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Readiness check probe verifying memory and essential components.
   */
  getReadiness() {
    const diagnostics = this.getDiagnostics();
    const isReady = diagnostics.status !== HealthStatus.CRITICAL;
    return {
      ready: isReady,
      status: diagnostics.status,
      timestamp: diagnostics.timestamp,
      issues: diagnostics.issues
    };
  }

  /**
   * Dispatches and handles native Node.js HTTP requests for health check endpoints.
   * @param {import('node:http').IncomingMessage} req 
   * @param {import('node:http').ServerResponse} res 
   * @returns {boolean} True if handled, false if not a health route
   */
  handleHttpRequest(req, res) {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname;
    const endpoints = this.config.endpoints;

    // Set JSON and CORS headers
    const headers = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
    };
    if (this.config.server.enableCors) {
      headers['Access-Control-Allow-Origin'] = '*';
      headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS';
      headers['Access-Control-Allow-Headers'] = 'Content-Type';
    }

    if (req.method === 'OPTIONS') {
      res.writeHead(204, headers);
      res.end();
      return true;
    }

    if (req.method !== 'GET') {
      return false;
    }

    if (pathname === endpoints.health) {
      const data = this.getDiagnostics();
      const statusCode = data.status === HealthStatus.CRITICAL ? 503 : 200;
      res.writeHead(statusCode, headers);
      res.end(JSON.stringify(data, null, 2));
      return true;
    }

    if (pathname === endpoints.liveness) {
      const data = this.getLiveness();
      res.writeHead(200, headers);
      res.end(JSON.stringify(data, null, 2));
      return true;
    }

    if (pathname === endpoints.readiness) {
      const data = this.getReadiness();
      const statusCode = data.ready ? 200 : 503;
      res.writeHead(statusCode, headers);
      res.end(JSON.stringify(data, null, 2));
      return true;
    }

    if (pathname === endpoints.telemetry) {
      res.writeHead(200, headers);
      res.end(JSON.stringify(this.engineMetrics, null, 2));
      return true;
    }

    return false;
  }
}

export const defaultHealthMonitor = new HealthMonitor();
export default HealthMonitor;