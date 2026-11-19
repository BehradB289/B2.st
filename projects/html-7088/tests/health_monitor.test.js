/**
 * @file tests/health_monitor.test.js
 * @description Unit tests for HealthMonitor and CLI Diagnostics in B2.st Mario Engine.
 * Studio: B2.st
 */

import assert from 'node:assert';
import { HealthMonitor, HealthStatus } from '../src/core/health_monitor.js';

export async function runTests() {
  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`    ✔ ${name}`);
      passed++;
    } catch (err) {
      console.error(`    ✖ ${name}`);
      console.error(`      ${err.message}`);
      failed++;
    }
  }

  console.log('  Testing HealthMonitor:');

  test('Should instantiate with default values and healthy status', () => {
    const monitor = new HealthMonitor();
    const diag = monitor.getDiagnostics();
    assert.strictEqual(diag.service, 'b2st-mario-engine');
    assert.ok(diag.uptimeSeconds >= 0);
    assert.ok([HealthStatus.HEALTHY, HealthStatus.DEGRADED].includes(diag.status));
    assert.ok(typeof diag.process.heapUsedBytes === 'number');
  });

  test('Should report correct Liveness probe response', () => {
    const monitor = new HealthMonitor();
    const live = monitor.getLiveness();
    assert.strictEqual(live.status, 'UP');
    assert.ok(live.uptimeSeconds >= 0);
    assert.ok(Date.parse(live.timestamp) > 0);
  });

  test('Should report correct Readiness probe response', () => {
    const monitor = new HealthMonitor();
    const ready = monitor.getReadiness();
    assert.strictEqual(typeof ready.ready, 'boolean');
    assert.ok(Array.isArray(ready.issues));
  });

  test('Should update engine telemetry and flag FPS degradation accurately', () => {
    const monitor = new HealthMonitor({
      thresholds: {
        minimumFpsThreshold: 30,
        targetFps: 60,
        heapMemoryCriticalPercent: 99,
        heapMemoryWarningPercent: 95,
        eventLoopLagWarningMs: 500,
        eventLoopLagCriticalMs: 1000
      }
    });

    // Provide low FPS
    monitor.updateTelemetry({ fps: 15, activeEntities: 42, activeLevel: 'World 1-2' });
    const diag = monitor.getDiagnostics();

    assert.strictEqual(diag.engineTelemetry.fps, 15);
    assert.strictEqual(diag.engineTelemetry.activeEntities, 42);
    assert.strictEqual(diag.status, HealthStatus.DEGRADED);
    assert.ok(diag.issues.some(i => i.includes('FPS dropped below threshold')));
  });

  test('Should handle HTTP health requests with proper status code and headers', () => {
    const monitor = new HealthMonitor();
    let writtenCode = 0;
    let writtenHeaders = {};
    let writtenBody = '';

    const mockReq = {
      url: '/health',
      method: 'GET',
      headers: { host: 'localhost:8080' }
    };

    const mockRes = {
      writeHead: (code, headers) => {
        writtenCode = code;
        writtenHeaders = headers;
      },
      end: (data) => {
        writtenBody = data;
      }
    };

    const handled = monitor.handleHttpRequest(mockReq, mockRes);
    assert.strictEqual(handled, true);
    assert.strictEqual(writtenCode, 200);
    assert.strictEqual(writtenHeaders['Content-Type'], 'application/json');

    const parsed = JSON.parse(writtenBody);
    assert.strictEqual(parsed.service, 'b2st-mario-engine');
  });

  test('Should reject non-health routes gracefully in handleHttpRequest', () => {
    const monitor = new HealthMonitor();
    const mockReq = {
      url: '/index.html',
      method: 'GET',
      headers: { host: 'localhost:8080' }
    };
    const mockRes = {};
    const handled = monitor.handleHttpRequest(mockReq, mockRes);
    assert.strictEqual(handled, false);
  });

  return { passed, failed };
}

// Auto-run if executed directly via Node
if (process.argv[1] && process.argv[1].endsWith('health_monitor.test.js')) {
  runTests().then(({ passed, failed }) => {
    if (failed > 0) process.exit(1);
  });
}