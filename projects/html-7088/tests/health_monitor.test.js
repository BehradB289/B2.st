```javascript
/**
 * ═══════════════════════════════════════════════════════════════
 *  🧪 تست‌های واحد — Health Monitor
 * ═══════════════════════════════════════════════════════════════
 */

'use strict';

const HealthMonitor = require('../src/core/health_monitor');

// ─────────────────────────── Test Helpers ───────────────────────────
let _testCount = 0;
let _passCount = 0;
let _failCount = 0;

function assert(condition, message) {
  _testCount++;
  if (condition) {
    _passCount++;
  } else {
    _failCount++;
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  _testCount++;
  if (actual === expected) {
    _passCount++;
  } else {
    _failCount++;
    throw new Error(`ASSERTION FAILED: ${message} — expected "${expected}", got "${actual}"`);
  }
}

function assertIncludes(arr, value, message) {
  _testCount++;
  if (arr.includes(value)) {
    _passCount++;
  } else {
    _failCount++;
    throw new Error(`ASSERTION FAILED: ${message} — "${value}" not found in array`);
  }
}

function describe(name, fn) {
  console.log(`\n  📦 ${name}`);
  fn();
}

function it(name, fn) {
  try {
    fn();
    console.log(`    ✅ ${name}`);
  } catch (e) {
    console.log(`    ❌ ${name}: ${e.message}`);
    throw e;
  }
}

// ─────────────────────────── Tests ───────────────────────────

function run() {
  describe('HealthMonitor — Constructor', () => {
    it('باید با مقادیر پیش‌فرض ساخته شود', () => {
      const monitor = new HealthMonitor();
      assertEqual(monitor.config.fpsThreshold, 30, 'fpsThreshold default');
      assertEqual(monitor.config.memoryThresholdMB, 512, 'memoryThresholdMB default');
      assertEqual(monitor.config.maxEntityCount, 1000, 'maxEntityCount default');
      assertEqual(monitor.config.checkIntervalMs, 5000, 'checkIntervalMs default');
      assertEqual(monitor.status, 'healthy', 'initial status');
    });

    it('باید کانفیگ سفارشی را بپذیرد', () => {
      const monitor = new HealthMonitor({
        fpsThreshold: 45,
        memoryThresholdMB: 256,
        maxEntityCount: 500,
      });
      assertEqual(monitor.config.fpsThreshold, 45, 'custom fpsThreshold');
      assertEqual(monitor.config.memoryThresholdMB, 256, 'custom memoryThresholdMB');
      assertEqual(monitor.config.maxEntityCount, 500, 'custom maxEntityCount');
    });
  });

  describe('HealthMonitor — updateMetrics', () => {
    it('باید متریک‌ها را به‌روز کند', () => {
      const monitor = new HealthMonitor();
      monitor.updateMetrics({ fps: 55, memoryUsageMB: 200, entityCount: 42 });
      assertEqual(monitor.metrics.fps, 55, 'fps updated');
      assertEqual(monitor.metrics.memoryUsageMB, 200, 'memory updated');
      assertEqual(monitor.metrics.entityCount, 42, 'entityCount updated');
    });

    it('باید فیلدهای ناشناخته را نادیده بگیرد', () => {
      const monitor = new HealthMonitor();
      monitor.updateMetrics({ unknownField: 999 });
      assert(!('unknownField' in monitor.metrics), 'unknown field ignored');
    });

    it('باید ورودی نامعتبر را نادیده بگیرد', () => {
      const monitor = new HealthMonitor();
      monitor.updateMetrics(null);
      monitor.updateMetrics(undefined);
      monitor.updateMetrics('string');
      assertEqual(monitor.metrics.fps, 60, 'metrics unchanged after invalid input');
    });
  });

  describe('HealthMonitor — evaluate (Healthy)', () => {
    it('باید وضعیت سالم برگرداند وقتی همه متریک‌ها نرمال هستند', () => {
      const monitor = new HealthMonitor();
      monitor.updateMetrics({
        fps: 60,
        memoryUsageMB: 100,
        entityCount: 50,
        physicsStepMs: 2,
        renderStepMs: 5,
      });
      const report = monitor.evaluate();
      assertEqual(report.status, 'healthy', 'status should be healthy');
      assert(report.checks.every(c => c.status === 'pass'), 'all checks should pass');
      assert(report.timestamp > 0, 'timestamp should exist');
      assert(report.isoTime.length > 0, 'isoTime should exist');
      assert(report.summary.includes('✅'), 'summary should have green check');
    });
  });

  describe('HealthMonitor — evaluate (Degraded)', () => {
    it('باید وضعیت degraded برگرداند وقتی FPS پایین است', () => {
      const monitor = new HealthMonitor({ fpsThreshold: 30 });
      monitor.updateMetrics({ fps: 20 });
      const report = monitor.evaluate();
      assertEqual(report.status, 'degraded', 'status should be degraded');
      const fpsCheck = report.checks.find(c => c.name === 'fps');
      assertEqual(fpsCheck.status, 'fail', 'fps check should fail');
    });

    it('باید وضعیت degraded برگرداند وقتی حافظه زیاد است', () => {
      const monitor = new HealthMonitor({ memoryThresholdMB: 256 });
      monitor.updateMetrics({ fps: 60, memoryUsageMB: 400 });
      const report = monitor.evaluate();
      assertEqual(report.status, 'degraded', 'status should be degraded');
    });

    it('باید وضعیت degraded برگرداند وقتی Entity زیاد است', () => {
      const monitor = new HealthMonitor({ maxEntityCount: 100 });
      monitor.updateMetrics({ fps: 60, entityCount: 150 });
      const report = monitor.evaluate();
      assertEqual(report.status, 'degraded', 'status should be degraded');
    });
  });

  describe('HealthMonitor — evaluate (Critical)', () => {
    it('باید وضعیت critical برگرداند وقتی FPS خیلی پایین است', () => {
      const monitor = new HealthMonitor({ fpsThreshold: 30 });
      monitor.updateMetrics({ fps: 10 }); // < 30 * 0.5 = 15
      const report = monitor.evaluate();
      const fpsCheck = report.checks.find(c => c.name === 'fps');
      assertEqual(fpsCheck.status, 'critical', 'fps should be critical');
    });

    it('باید وضعیت critical برگرداند وقتی چند بررسی شکست بخورد', () => {
      const monitor = new HealthMonitor({
        fpsThreshold: 30,
        memoryThresholdMB: 100,
        maxEntityCount: 50,
      });
      monitor.updateMetrics({
        fps: 20,
        memoryUsageMB: 200,
        entityCount: 100,
      });
      const report = monitor.evaluate();
      assertEqual(report.status, 'critical', 'status should be critical with 3+ failures');
    });
  });

  describe('HealthMonitor — History', () => {
    it('باید تاریخچه را ذخیره کند', () => {
      const monitor = new HealthMonitor();
      monitor.evaluate();
      monitor.evaluate();
      monitor.evaluate();
      assertEqual(monitor.history.length, 3, 'history should have 3 entries');
    });

    it('باید تاریخچه را محدود کند', () => {
      const monitor = new HealthMonitor({ historySize: 10 });
      for (let i = 0; i < 20; i++) {
        monitor.evaluate();
      }
      assertEqual(monitor.history.length, 10, 'history should be capped at 10');
    });

    it('getHistory باید کپی برگرداند', () => {
      const monitor = new HealthMonitor();
      monitor.evaluate();
      const history = monitor.getHistory();
      history.push('fake');
      assertEqual(monitor.history.length, 1, 'original history unchanged');
    });

    it('getHistory با limit باید تعداد محدود برگرداند', () => {
      const monitor = new HealthMonitor();
      for (let i = 0; i < 10; i++) monitor.evaluate();
      const last3 = monitor.getHistory(3);
      assertEqual(last3.length, 3, 'should return 3 entries');
    });
  });

  describe('HealthMonitor — getStats', () => {
    it('باید آمار خالی برگرداند وقتی تاریخچه خالی است', () => {
      const monitor = new HealthMonitor();
      const stats = monitor.getStats();
      assertEqual(stats.totalChecks, 0, 'totalChecks should be 0');
    });

    it('باید آمار صحیح برگرداند', () => {
      const monitor = new HealthMonitor();
      monitor.updateMetrics({ fps: 60, memoryUsageMB: 100 });
      monitor.evaluate();
      monitor.evaluate();
      const stats = monitor.getStats();
      assertEqual(stats.totalChecks, 2, 'totalChecks should be 2');
      assertEqual(stats.healthyPercent, 100, 'healthyPercent should be 100');
      assertEqual(stats.lastStatus, 'healthy', 'lastStatus should be healthy');
    });
  });

  describe('HealthMonitor — Alert System', () => {
    it('باید هشدار ارسال کند وقتی وضعیت سالم نیست', () => {
      const monitor = new HealthMonitor({ fpsThreshold: 30 });
      let alertFired = false;
      let alertReport = null;

      monitor.onAlert((report) => {
        alertFired = true;
        alertReport = report;
      });

      monitor.updateMetrics({ fps: 20 });
      monitor.evaluate();

      assert(alertFired, 'alert should fire');
      assertEqual(alertReport.status, 'degraded', 'alert report status');
    });

    it('نباید هشدار ارسال کند وقتی وضعیت سالم است', () => {
      const monitor = new HealthMonitor();
      let alertFired = false;

      monitor.onAlert(() => { alertFired = true; });
      monitor.updateMetrics({ fps: 60 });
      monitor.evaluate();

      assert(!alertFired, 'alert should not fire when healthy');
    });

    it('باید بتوان هشدار را حذف کرد', () => {
      const monitor = new HealthMonitor({ fpsThreshold: 30 });
      let count = 0;
      const cb = () => { count++; };

      monitor.onAlert(cb);
      monitor.updateMetrics({ fps: 20 });
      monitor.evaluate();
      assertEqual(count, 1, 'alert fired once');

      monitor.offAlert(cb);
      monitor.evaluate();
      assertEqual(count, 1, 'alert not fired after removal');
    });
  });

  describe('HealthMonitor — tick (FPS Calculation)', () => {
    it('باید FPS را بعد از ۱ ثانیه محاسبه کند', () => {
      const monitor = new HealthMonitor();
      // Simulate 60 frames in 1 second
      for (let i = 0; i < 60; i++) {
        monitor.tick(1 / 60);
      }
      // After ~1 second of ticks, FPS should be calculated
      assert(monitor.metrics.fps > 0, 'fps should be calculated');
    });
  });

  describe('HealthMonitor — reset', () => {
    it('باید مانیتور را کاملاً بازنشانی کند', () => {
      const monitor = new HealthMonitor();
      monitor.updateMetrics({ fps: 20, memoryUsageMB: 999 });
      monitor.evaluate();
      monitor.evaluate();

      monitor.reset();

      assertEqual(monitor.status, 'healthy', 'status reset');
      assertEqual(monitor.history.length, 0, 'history cleared');
      assertEqual(monitor.metrics.fps, 60, 'fps reset to default');
      assertEqual(monitor.metrics.memoryUsageMB, 0, 'memory reset');
    });
  });

  describe('HealthMonitor — toText', () => {
    it('باید خروجی متنی تولید کند', () => {
      const monitor = new HealthMonitor();
      monitor.updateMetrics({ fps: 60, uptime: 42.5 });
      const text = monitor.toText();
      assert(text.includes('HEALTHY'), 'should contain HEALTHY');
      assert(text.length > 50, 'should have substantial content');
    });
  });

  describe('HealthMonitor — toHttpResponse', () => {
    it('باید پاسخ HTTP صحیح برای وضعیت سالم برگرداند', () => {
      const monitor = new HealthMonitor();
      monitor.updateMetrics({ fps: 60 });
      const resp = monitor.toHttpResponse();
      assertEqual(resp.statusCode, 200, 'status code 200');
      assert(resp.headers['Content-Type'].includes('json'), 'json content type');
      assert(resp.body.length > 0, 'body not empty');
    });

    it('باید پاسخ HTTP 503 برای وضعیت degraded برگرداند', () => {
      const monitor = new HealthMonitor({ fpsThreshold: 30 });
      monitor.updateMetrics({ fps: 20 });
      const resp = monitor.toHttpResponse();
      assertEqual(resp.statusCode, 503, 'status code 503');
    });
  });

  // ── Summary ──
  console.log(`\n  ─────────────────────────────────`);
  console.log(`  ✅ ${_passCount} passed  ❌ ${_failCount} failed  📊 ${_testCount} total`);
  console.log('');

  if (_failCount > 0) {
    throw new Error(`${_failCount} test(s) failed`);
  }
}

// Export
module.exports = { run };

// Run directly
if (require.main === module) {
  run();
}
```