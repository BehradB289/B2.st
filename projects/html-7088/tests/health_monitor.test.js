/**
 * Automated Unit Tests for HealthMonitor Subsystem
 * Layer: Tests (Layer 4)
 */

import assert from 'node:assert';
import { HealthMonitor, HealthStatus } from '../src/core/health_monitor.js';

export async function runTests() {
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${name}`);
      console.error(`    ${err.message}`);
      failed++;
    }
  }

  console.log('\n--- Running HealthMonitor Test Suite ---');

  // Test 1: Initialization defaults
  await test('should initialize with UP status and nominal metrics', async () => {
    const monitor = new HealthMonitor({ sampleIntervalMs: 50 });
    const report = await monitor.getHealthReport();
    monitor.stop();

    assert.strictEqual(report.status, HealthStatus.UP);
    assert.strictEqual(report.service, 'b2st-mario-engine');
    assert.strictEqual(typeof report.uptimeSeconds, 'number');
    assert.strictEqual(typeof report.checks.memory, 'object');
    assert.strictEqual(typeof report.checks.eventLoop, 'object');
  });

  // Test 2: Custom pluggable check - UP
  await test('should register and execute healthy custom check', async () => {
    const monitor = new HealthMonitor({ sampleIntervalMs: 50 });
    monitor.registerCheck('physicsEngine', async () => ({
      status: HealthStatus.UP,
      message: 'AABB QuadTree active'
    }));

    const report = await monitor.getHealthReport();
    monitor.stop();

    assert.strictEqual(report.status, HealthStatus.UP);
    assert.strictEqual(report.checks.physicsEngine.status, HealthStatus.UP);
    assert.strictEqual(report.checks.physicsEngine.message, 'AABB QuadTree active');
  });

  // Test 3: Non-critical check degraded -> Overall DEGRADED
  await test('should transition to DEGRADED when non-critical check fails', async () => {
    const monitor = new HealthMonitor({ sampleIntervalMs: 50 });
    monitor.registerCheck('audioSystem', async () => ({
      status: HealthStatus.DEGRADED,
      message: 'WebAudio context suspended'
    }), { critical: false });

    const report = await monitor.getHealthReport();
    monitor.stop();

    assert.strictEqual(report.status, HealthStatus.DEGRADED);
    assert.strictEqual(report.checks.audioSystem.status, HealthStatus.DEGRADED);
  });

  // Test 4: Critical check failure -> Overall DOWN
  await test('should transition to DOWN when critical check fails', async () => {
    const monitor = new HealthMonitor({ sampleIntervalMs: 50 });
    monitor.registerCheck('levelStorage', async () => {
      throw new Error('Disk read failure');
    }, { critical: true });

    const report = await monitor.getHealthReport();
    monitor.stop();

    assert.strictEqual(report.status, HealthStatus.DOWN);
    assert.strictEqual(report.checks.levelStorage.status, HealthStatus.DOWN);
    assert.match(report.checks.levelStorage.message, /Disk read failure/);
  });

  // Test 5: Engine metrics update and Prometheus export
  await test('should update engine metrics and format Prometheus text export', async () => {
    const monitor = new HealthMonitor({ sampleIntervalMs: 50 });
    monitor.updateEngineMetrics({
      activeEntities: 18,
      tickLatencyMs: 1.45,
      tickRateFps: 59.94,
      physicsCollisionsCount: 42
    });

    const prom = await monitor.getPrometheusMetrics();
    monitor.stop();

    assert.match(prom, /mario_engine_active_entities 18/);
    assert.match(prom, /mario_engine_tick_latency_milliseconds 1\.450/);
    assert.match(prom, /mario_engine_collisions_total 42/);
    assert.match(prom, /b2st_mario_health_status 1/);
  });

  // Test 6: HTTP Request simulation for /health and /metrics
  await test('should correctly handle mock HTTP requests for /health and /metrics', async () => {
    const monitor = new HealthMonitor({ sampleIntervalMs: 50 });

    // Mock response helper
    const createMockRes = () => {
      let headers = {};
      let statusCode = 200;
      let body = '';
      return {
        writeHead: (code, h) => {
          statusCode = code;
          headers = h;
        },
        end: (data) => {
          body = data;
        },
        getStatusCode: () => statusCode,
        getBody: () => body
      };
    };

    const resHealth = createMockRes();
    const handledHealth = await monitor.handleHttpRequest({ url: '/health', method: 'GET' }, resHealth);
    assert.strictEqual(handledHealth, true);
    assert.strictEqual(resHealth.getStatusCode(), 200);
    const parsedHealth = JSON.parse(resHealth.getBody());
    assert.strictEqual(parsedHealth.status, HealthStatus.UP);

    const resMetrics = createMockRes();
    const handledMetrics = await monitor.handleHttpRequest({ url: '/metrics', method: 'GET' }, resMetrics);
    assert.strictEqual(handledMetrics, true);
    assert.strictEqual(resMetrics.getStatusCode(), 200);
    assert.match(resMetrics.getBody(), /nodejs_heap_size_used_bytes/);

    const resUnknown = createMockRes();
    const handledUnknown = await monitor.handleHttpRequest({ url: '/some/asset.png', method: 'GET' }, resUnknown);
    assert.strictEqual(handledUnknown, false);

    monitor.stop();
  });

  return { total: passed + failed, passed, failed };
}

// Run immediately if executed via node directly
if (process.argv[1]?.endsWith('health_monitor.test.js')) {
  runTests().then((res) => {
    process.exit(res.failed > 0 ? 1 : 0);
  });
}