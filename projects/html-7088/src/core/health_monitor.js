/**
 * B2.st Mario HTML5 Game Engine - Core Health & Telemetry Monitor
 * Layer: Core Subsystem / Telemetry
 * 
 * Features:
 * - Real-time metrics: Process Memory, CPU, OS Load, Event Loop Latency.
 * - Game Engine Metrics: Tick Latency, Active Entities, Dropped Frames.
 * - Pluggable Health Checks with Critical / Non-Critical severity.
 * - Enterprise Endpoints:
 *     * /health           -> Comprehensive JSON health status (UP, DEGRADED, DOWN)
 *     * /health/liveness  -> Kubernetes Liveness Probe
 *     * /health/readiness -> Kubernetes Readiness Probe
 *     * /metrics          -> OpenMetrics / Prometheus standard text format
 * - Zero external dependencies, pure Node.js ES6+.
 */

import os from 'node:os';
import process from 'node:process';
import { performance } from 'node:perf_hooks';
import EventEmitter from 'node:events';

export const HealthStatus = {
  UP: 'UP',
  DEGRADED: 'DEGRADED',
  DOWN: 'DOWN'
};

export class HealthMonitor extends EventEmitter {
  /**
   * @param {Object} options Configuration overrides
   */
  constructor(options = {}) {
    super();
    this.serviceName = options.serviceName || 'b2st-mario-engine';
    this.version = options.version || '1.0.0';
    this.startTime = Date.now();
    this.startHrTime = process.hrtime.bigint();

    this.thresholds = {
      heapWarningRatio: options.heapWarningRatio ?? 0.85,
      eventLoopLagWarningMs: options.eventLoopLagWarningMs ?? 100,
      ...options.thresholds
    };

    // Registered subsystem checks: Map<name, { checkFn, critical, lastResult, timeoutMs }>
    this._checks = new Map();

    // Internal Game Engine telemetry counters
    this.engineMetrics = {
      activeEntities: 0,
      tickRateFps: 60.0,
      tickLatencyMs: 0.0,
      physicsCollisionsCount: 0,
      droppedFrames: 0,
      levelName: 'world-1-1'
    };

    // Event Loop Lag measurement state
    this._eventLoopLagMs = 0;
    this._lastLagCheckTime = performance.now();
    this._lagSamplerInterval = null;
    this._sampleIntervalMs = options.sampleIntervalMs || 1000;

    this._initBuiltInChecks();
    this._startEventLoopSampler();
  }

  /**
   * Register built-in system checks (Memory, Event Loop, System Resources)
   */
  _initBuiltInChecks() {
    this.registerCheck('memory', async () => {
      const mem = process.memoryUsage();
      const heapUsedRatio = mem.heapUsed / mem.heapTotal;
      const isWarn = heapUsedRatio > this.thresholds.heapWarningRatio;

      return {
        status: isWarn ? HealthStatus.DEGRADED : HealthStatus.UP,
        details: {
          heapUsedBytes: mem.heapUsed,
          heapTotalBytes: mem.heapTotal,
          heapUsedRatio: parseFloat(heapUsedRatio.toFixed(4)),
          rssBytes: mem.rss,
          warningThresholdRatio: this.thresholds.heapWarningRatio
        },
        message: isWarn
          ? `Heap usage exceeds threshold (${(heapUsedRatio * 100).toFixed(1)}% > ${(this.thresholds.heapWarningRatio * 100)}%)`
          : 'Memory usage within nominal boundaries'
      };
    }, { critical: false });

    this.registerCheck('eventLoop', async () => {
      const lag = this._eventLoopLagMs;
      const isSlow = lag > this.thresholds.eventLoopLagWarningMs;

      return {
        status: isSlow ? HealthStatus.DEGRADED : HealthStatus.UP,
        details: {
          eventLoopLagMs: parseFloat(lag.toFixed(2)),
          thresholdMs: this.thresholds.eventLoopLagWarningMs
        },
        message: isSlow
          ? `Event loop latency elevated: ${lag.toFixed(2)}ms (warn: >${this.thresholds.eventLoopLagWarningMs}ms)`
          : 'Event loop execution latency optimal'
      };
    }, { critical: false });
  }

  /**
   * Starts a non-blocking background sampler for Event Loop drift/lag.
   */
  _startEventLoopSampler() {
    if (this._lagSamplerInterval) return;

    this._lagSamplerInterval = setInterval(() => {
      const now = performance.now();
      const delta = now - this._lastLagCheckTime;
      // Drift beyond expected interval represents event loop blockage
      this._eventLoopLagMs = Math.max(0, delta - this._sampleIntervalMs);
      this._lastLagCheckTime = now;
    }, this._sampleIntervalMs);

    if (this._lagSamplerInterval.unref) {
      this._lagSamplerInterval.unref();
    }
  }

  /**
   * Stops the background sampler (used during teardown/unit tests).
   */
  stop() {
    if (this._lagSamplerInterval) {
      clearInterval(this._lagSamplerInterval);
      this._lagSamplerInterval = null;
    }
  }

  /**
   * Registers a health check provider for a game or system component.
   * @param {string} name Unique check name
   * @param {Function} checkFn Async function returning { status, details, message }
   * @param {Object} options { critical: boolean, timeoutMs: number }
   */
  registerCheck(name, checkFn, options = {}) {
    if (typeof checkFn !== 'function') {
      throw new TypeError(`Health check handler for "${name}" must be a function.`);
    }

    this._checks.set(name, {
      checkFn,
      critical: options.critical !== false,
      timeoutMs: options.timeoutMs || 3000,
      lastResult: null
    });
  }

  /**
   * Unregisters a check provider.
   * @param {string} name Check name
   */
  unregisterCheck(name) {
    this._checks.delete(name);
  }

  /**
   * Update real-time metrics pushed from the Mario Engine Game Loop.
   * @param {Partial<typeof this.engineMetrics>} metrics 
   */
  updateEngineMetrics(metrics) {
    Object.assign(this.engineMetrics, metrics);
    this.emit('metricsUpdated', this.engineMetrics);
  }

  /**
   * Executes an individual check with timeout protection.
   * @private
   */
  async _runCheck(name, checkMeta) {
    const startTime = performance.now();
    try {
      const resultPromise = checkMeta.checkFn();
      let timer;
      const timeoutPromise = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`Check "${name}" timed out after ${checkMeta.timeoutMs}ms`)), checkMeta.timeoutMs);
      });

      const result = await Promise.race([resultPromise, timeoutPromise]);
      clearTimeout(timer);

      const durationMs = parseFloat((performance.now() - startTime).toFixed(2));
      const evaluated = {
        status: result?.status || HealthStatus.UP,
        critical: checkMeta.critical,
        durationMs,
        details: result?.details || {},
        message: result?.message || 'Nominal operation'
      };
      checkMeta.lastResult = evaluated;
      return evaluated;
    } catch (err) {
      const durationMs = parseFloat((performance.now() - startTime).toFixed(2));
      const failedResult = {
        status: HealthStatus.DOWN,
        critical: checkMeta.critical,
        durationMs,
        details: { error: err.message, stack: err.stack },
        message: `Check execution failed: ${err.message}`
      };
      checkMeta.lastResult = failedResult;
      this.emit('checkFailed', { name, ...failedResult });
      return failedResult;
    }
  }

  /**
   * Aggregates all registered checks and returns comprehensive health status.
   * @returns {Promise<Object>}
   */
  async getHealthReport() {
    const checksResults = {};
    let overallStatus = HealthStatus.UP;

    const checkEntries = Array.from(this._checks.entries());
    const executedChecks = await Promise.all(
      checkEntries.map(async ([name, checkMeta]) => {
        const result = await this._runCheck(name, checkMeta);
        return [name, result];
      })
    );

    for (const [name, result] of executedChecks) {
      checksResults[name] = result;

      if (result.status === HealthStatus.DOWN) {
        if (result.critical) {
          overallStatus = HealthStatus.DOWN;
        } else if (overallStatus !== HealthStatus.DOWN) {
          overallStatus = HealthStatus.DEGRADED;
        }
      } else if (result.status === HealthStatus.DEGRADED && overallStatus === HealthStatus.UP) {
        overallStatus = HealthStatus.DEGRADED;
      }
    }

    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);
    const mem = process.memoryUsage();
    const cpus = os.cpus();

    const report = {
      status: overallStatus,
      service: this.serviceName,
      version: this.version,
      timestamp: new Date().toISOString(),
      uptimeSeconds,
      system: {
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        cpuCount: cpus.length,
        osLoadAverage: os.loadavg(),
        freeMemoryBytes: os.freemem(),
        totalMemoryBytes: os.totalmem(),
        processMemory: {
          heapUsedBytes: mem.heapUsed,
          heapTotalBytes: mem.heapTotal,
          rssBytes: mem.rss
        },
        eventLoopLagMs: parseFloat(this._eventLoopLagMs.toFixed(2))
      },
      engine: { ...this.engineMetrics },
      checks: checksResults
    };

    return report;
  }

  /**
   * Fast Liveness Probe for Kubernetes / Process Monitors.
   */
  getLivenessReport() {
    return {
      status: HealthStatus.UP,
      service: this.serviceName,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000)
    };
  }

  /**
   * Readiness Probe verifying critical dependencies and engine initialization.
   */
  async getReadinessReport() {
    const criticalChecks = Array.from(this._checks.entries()).filter(([_, c]) => c.critical);
    let ready = true;
    const failures = [];

    for (const [name, checkMeta] of criticalChecks) {
      const result = await this._runCheck(name, checkMeta);
      if (result.status === HealthStatus.DOWN) {
        ready = false;
        failures.push({ check: name, message: result.message });
      }
    }

    return {
      status: ready ? HealthStatus.UP : HealthStatus.DOWN,
      ready,
      timestamp: new Date().toISOString(),
      failures
    };
  }

  /**
   * Produces OpenMetrics / Prometheus standard text exposition format.
   * @returns {Promise<string>}
   */
  async getPrometheusMetrics() {
    const mem = process.memoryUsage();
    const cpu = process.cpuUsage();
    const uptimeSec = Math.floor((Date.now() - this.startTime) / 1000);
    const health = await this.getHealthReport();
    const statusCode = health.status === HealthStatus.UP ? 1 : health.status === HealthStatus.DEGRADED ? 0.5 : 0;

    const lines = [
      '# HELP process_uptime_seconds Total runtime of the Mario game engine server in seconds.',
      '# TYPE process_uptime_seconds counter',
      `process_uptime_seconds ${uptimeSec}`,
      '',
      '# HELP b2st_mario_health_status Overall health indicator (1 = UP, 0.5 = DEGRADED, 0 = DOWN).',
      '# TYPE b2st_mario_health_status gauge',
      `b2st_mario_health_status ${statusCode}`,
      '',
      '# HELP nodejs_heap_size_used_bytes Process heap memory currently used in bytes.',
      '# TYPE nodejs_heap_size_used_bytes gauge',
      `nodejs_heap_size_used_bytes ${mem.heapUsed}`,
      '',
      '# HELP nodejs_heap_size_total_bytes Total allocated process heap memory in bytes.',
      '# TYPE nodejs_heap_size_total_bytes gauge',
      `nodejs_heap_size_total_bytes ${mem.heapTotal}`,
      '',
      '# HELP nodejs_resident_memory_bytes Resident Set Size (RSS) memory in bytes.',
      '# TYPE nodejs_resident_memory_bytes gauge',
      `nodejs_resident_memory_bytes ${mem.rss}`,
      '',
      '# HELP nodejs_event_loop_lag_milliseconds Measured event loop scheduling delay.',
      '# TYPE nodejs_event_loop_lag_milliseconds gauge',
      `nodejs_event_loop_lag_milliseconds ${this._eventLoopLagMs.toFixed(3)}`,
      '',
      '# HELP process_cpu_user_seconds_total Total user CPU time spent in seconds.',
      '# TYPE process_cpu_user_seconds_total counter',
      `process_cpu_user_seconds_total ${(cpu.user / 1e6).toFixed(4)}`,
      '',
      '# HELP process_cpu_system_seconds_total Total system CPU time spent in seconds.',
      '# TYPE process_cpu_system_seconds_total counter',
      `process_cpu_system_seconds_total ${(cpu.system / 1e6).toFixed(4)}`,
      '',
      '# HELP mario_engine_active_entities Number of currently active entities in the game world.',
      '# TYPE mario_engine_active_entities gauge',
      `mario_engine_active_entities ${this.engineMetrics.activeEntities}`,
      '',
      '# HELP mario_engine_tick_latency_milliseconds Mean latency of game simulation frame ticks.',
      '# TYPE mario_engine_tick_latency_milliseconds gauge',
      `mario_engine_tick_latency_milliseconds ${this.engineMetrics.tickLatencyMs.toFixed(3)}`,
      '',
      '# HELP mario_engine_tick_fps Actual or target frames per second of the game simulation loop.',
      '# TYPE mario_engine_tick_fps gauge',
      `mario_engine_tick_fps ${this.engineMetrics.tickRateFps.toFixed(2)}`,
      '',
      '# HELP mario_engine_collisions_total Total collision resolutions processed by AABB physics.',
      '# TYPE mario_engine_collisions_total counter',
      `mario_engine_collisions_total ${this.engineMetrics.physicsCollisionsCount}`,
      ''
    ];

    return lines.join('\n');
  }

  /**
   * HTTP Dispatcher for health and telemetry routes.
   * Returns true if route was handled, false otherwise.
   * @param {import('node:http').IncomingMessage} req 
   * @param {import('node:http').ServerResponse} res 
   */
  async handleHttpRequest(req, res) {
    const urlPath = (req.url || '/').split('?')[0];

    // CORS pre-flight
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      res.end();
      return true;
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return false;
    }

    // Route: /health or /api/health
    if (urlPath === '/health' || urlPath === '/api/health') {
      const report = await this.getHealthReport();
      const statusCode = report.status === HealthStatus.DOWN ? 503 : 200;
      res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify(report, null, 2));
      return true;
    }

    // Route: /health/liveness or /health/live
    if (urlPath === '/health/liveness' || urlPath === '/health/live') {
      const live = this.getLivenessReport();
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify(live));
      return true;
    }

    // Route: /health/readiness or /health/ready
    if (urlPath === '/health/readiness' || urlPath === '/health/ready') {
      const readyReport = await this.getReadinessReport();
      const statusCode = readyReport.ready ? 200 : 503;
      res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify(readyReport));
      return true;
    }

    // Route: /metrics
    if (urlPath === '/metrics') {
      const metricsText = await this.getPrometheusMetrics();
      res.writeHead(200, {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(metricsText);
      return true;
    }

    return false;
  }
}

export default HealthMonitor;