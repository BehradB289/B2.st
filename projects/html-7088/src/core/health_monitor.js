```javascript
/**
 * ═══════════════════════════════════════════════════════════════
 *  🏥 B2.st Mario — Health Monitor Service
 *  سرویس پایش سلامت سیستم بازی
 * ═══════════════════════════════════════════════════════════════
 *
 *  این ماژول هم در سمت سرور (Node.js / CLI) و هم در سمت
 *  کلاینت (مرورگر / Canvas Game Loop) قابل استفاده است.
 *
 *  Usage (Node):
 *    const HealthMonitor = require('./core/health_monitor');
 *    const monitor = new HealthMonitor({ fpsThreshold: 30 });
 *    monitor.updateMetrics({ fps: 58, memoryUsageMB: 120 });
 *    const report = monitor.getReport();
 *
 *  Usage (Browser):
 *    const monitor = new HealthMonitor();
 *    // Inside game loop:
 *    monitor.tick(deltaTime);
 *    if (monitor.status !== 'healthy') console.warn('Performance issue!');
 * ═══════════════════════════════════════════════════════════════
 */

'use strict';

class HealthMonitor {
  /**
   * @param {Object} config
   * @param {number} [config.checkIntervalMs=5000]    - فاصله بررسی خودکار (میلی‌ثانیه)
   * @param {number} [config.memoryThresholdMB=512]   - آستانه حافظه (مگابایت)
   * @param {number} [config.fpsThreshold=30]         - حداقل FPS قابل قبول
   * @param {number} [config.maxEntityCount=1000]     - حداکثر تعداد Entity
   * @param {number} [config.physicsStepThresholdMs=16] - آستانه زمان فیزیک (ms)
   * @param {number} [config.renderStepThresholdMs=16]  - آستانه زمان رندر (ms)
   * @param {number} [config.historySize=100]         - حداکثر تعداد رکورد تاریخچه
   */
  constructor(config = {}) {
    this.config = {
      checkIntervalMs:        config.checkIntervalMs        ?? 5000,
      memoryThresholdMB:      config.memoryThresholdMB      ?? 512,
      fpsThreshold:           config.fpsThreshold           ?? 30,
      maxEntityCount:         config.maxEntityCount         ?? 1000,
      physicsStepThresholdMs: config.physicsStepThresholdMs ?? 16,
      renderStepThresholdMs:  config.renderStepThresholdMs  ?? 16,
      historySize:            config.historySize            ?? 100,
    };

    this.metrics = {
      uptime:          0,
      fps:             60,
      memoryUsageMB:   0,
      entityCount:     0,
      physicsStepMs:   0,
      renderStepMs:    0,
      collisionChecks: 0,
      activeLevel:     null,
      playerState:     null,
    };

    this.status   = 'healthy';   // 'healthy' | 'degraded' | 'critical'
    this.history  = [];
    this._intervalId = null;
    this._startTime  = Date.now();

    // FPS calculation (browser-side)
    this._frameCount   = 0;
    this._fpsTimer     = 0;
    this._lastFpsCalc  = 0;

    // Alert callbacks
    this._alertCallbacks = [];
  }

  // ─────────────────────────── Metrics Update ───────────────────────────

  /**
   * به‌روزرسانی متریک‌ها (partial update)
   * @param {Object} partial - فیلدهای متریک برای به‌روزرسانی
   */
  updateMetrics(partial) {
    if (!partial || typeof partial !== 'object') return;
    Object.keys(partial).forEach(key => {
      if (key in this.metrics) {
        this.metrics[key] = partial[key];
      }
    });
  }

  /**
   * تیک فریم بازی — برای محاسبه FPS در حلقه بازی مرورگر
   * @param {number} deltaTime - زمان بین فریم‌ها (ثانیه)
   */
  tick(deltaTime) {
    this._frameCount++;
    this._fpsTimer += deltaTime;
    this.metrics.uptime = (Date.now() - this._startTime) / 1000;

    if (this._fpsTimer >= 1.0) {
      this.metrics.fps = Math.round(this._frameCount / this._fpsTimer);
      this._frameCount = 0;
      this._fpsTimer = 0;
      this._lastFpsCalc = Date.now();
    }
  }

  // ─────────────────────────── Health Evaluation ───────────────────────────

  /**
   * ارزیابی سلامت سیستم و تولید گزارش
   * @returns {HealthReport}
   */
  evaluate() {
    const checks = [];
    let criticalCount = 0;
    let failCount = 0;

    // ── Check 1: FPS ──
    const fpsStatus = this._evaluateCheck(
      'fps',
      'نرخ فریم (FPS)',
      this.metrics.fps,
      this.config.fpsThreshold,
      'gte' // greater than or equal
    );
    checks.push(fpsStatus);

    // ── Check 2: Memory ──
    const memStatus = this._evaluateCheck(
      'memory',
      'مصرف حافظه (MB)',
      this.metrics.memoryUsageMB,
      this.config.memoryThresholdMB,
      'lte' // less than or equal
    );
    checks.push(memStatus);

    // ── Check 3: Entity Count ──
    const entityStatus = this._evaluateCheck(
      'entityCount',
      'تعداد Entity‌ها',
      this.metrics.entityCount,
      this.config.maxEntityCount,
      'lte'
    );
    checks.push(entityStatus);

    // ── Check 4: Physics Step ──
    const physicsStatus = this._evaluateCheck(
      'physicsStep',
      'زمان محاسبه فیزیک (ms)',
      this.metrics.physicsStepMs,
      this.config.physicsStepThresholdMs,
      'lte'
    );
    checks.push(physicsStatus);

    // ── Check 5: Render Step ──
    const renderStatus = this._evaluateCheck(
      'renderStep',
      'زمان رندر (ms)',
      this.metrics.renderStepMs,
      this.config.renderStepThresholdMs,
      'lte'
    );
    checks.push(renderStatus);

    // ── Determine overall status ──
    checks.forEach(c => {
      if (c.status === 'fail') failCount++;
      if (c.status === 'critical') criticalCount++;
    });

    if (criticalCount > 0 || failCount >= 3) {
      this.status = 'critical';
    } else if (failCount > 0) {
      this.status = 'degraded';
    } else {
      this.status = 'healthy';
    }

    const report = {
      timestamp:   Date.now(),
      isoTime:     new Date().toISOString(),
      status:      this.status,
      checks,
      metrics:     { ...this.metrics },
      config:      { ...this.config },
      summary:     this._generateSummary(checks),
    };

    // Store in history
    this.history.push(report);
    if (this.history.length > this.config.historySize) {
      this.history.shift();
    }

    // Fire alerts if degraded/critical
    if (this.status !== 'healthy') {
      this._fireAlerts(report);
    }

    return report;
  }

  /**
   * @private
   */
  _evaluateCheck(name, label, value, threshold, comparator) {
    let status = 'pass';
    let message = '';

    const numValue = typeof value === 'number' ? value : 0;

    if (comparator === 'gte') {
      if (numValue < threshold) {
        status = numValue < threshold * 0.5 ? 'critical' : 'fail';
        message = `${label}: ${numValue} کمتر از آستانه ${threshold}`;
      } else {
        message = `${label}: ${numValue} — سالم`;
      }
    } else if (comparator === 'lte') {
      if (numValue > threshold) {
        status = numValue > threshold * 2 ? 'critical' : 'fail';
        message = `${label}: ${numValue} بیشتر از آستانه ${threshold}`;
      } else {
        message = `${label}: ${numValue} — سالم`;
      }
    }

    return { name, label, status, value: numValue, threshold, message };
  }

  /**
   * @private
   */
  _generateSummary(checks) {
    const passed = checks.filter(c => c.status === 'pass').length;
    const failed = checks.filter(c => c.status === 'fail').length;
    const critical = checks.filter(c => c.status === 'critical').length;
    const total = checks.length;

    if (critical > 0) {
      return `⛔ بحرانی: ${critical} بررسی بحرانی از ${total}`;
    }
    if (failed > 0) {
      return `⚠️ هشدار: ${failed} بررسی ناموفق از ${total}`;
    }
    return `✅ سالم: تمام ${total} بررسی موفق`;
  }

  // ─────────────────────────── Report Access ───────────────────────────

  /**
   * دریافت گزارش سلامت فعلی
   * @returns {HealthReport}
   */
  getReport() {
    return this.evaluate();
  }

  /**
   * دریافت تاریخچه گزارش‌ها
   * @param {number} [limit] - حداکثر تعداد رکورد
   * @returns {HealthReport[]}
   */
  getHistory(limit) {
    if (limit && limit > 0) {
      return this.history.slice(-limit);
    }
    return [...this.history];
  }

  /**
   * دریافت خلاصه آماری از تاریخچه
   * @returns {Object}
   */
  getStats() {
    if (this.history.length === 0) {
      return { totalChecks: 0, healthyPercent: 0, avgFps: 0, avgMemory: 0 };
    }

    let healthyCount = 0;
    let totalFps = 0;
    let totalMemory = 0;

    this.history.forEach(report => {
      if (report.status === 'healthy') healthyCount++;
      totalFps += report.metrics.fps || 0;
      totalMemory += report.metrics.memoryUsageMB || 0;
    });

    const count = this.history.length;
    return {
      totalChecks:    count,
      healthyPercent: Math.round((healthyCount / count) * 100),
      avgFps:         Math.round(totalFps / count),
      avgMemory:      Math.round((totalMemory / count) * 100) / 100,
      lastStatus:     this.history[count - 1].status,
      uptime:         this.metrics.uptime,
    };
  }

  // ─────────────────────────── Periodic Check ───────────────────────────

  /**
   * شروع بررسی دوره‌ای خودکار
   * @param {Function} [beforeCheck] - تابعی که قبل از هر بررسی اجرا می‌شود
   */
  startPeriodicCheck(beforeCheck) {
    this.stop(); // Clear any existing interval

    this._intervalId = setInterval(() => {
      if (typeof beforeCheck === 'function') {
        beforeCheck();
      }
      this.evaluate();
    }, this.config.checkIntervalMs);

    // Don't prevent Node.js from exiting
    if (this._intervalId && typeof this._intervalId.unref === 'function') {
      this._intervalId.unref();
    }
  }

  /**
   * توقف بررسی دوره‌ای
   */
  stop() {
    if (this._intervalId) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
  }

  // ─────────────────────────── Alert System ───────────────────────────

  /**
   * ثبت callback برای هشدارها
   * @param {Function} callback - تابع callback(report)
   */
  onAlert(callback) {
    if (typeof callback === 'function') {
      this._alertCallbacks.push(callback);
    }
  }

  /**
   * حذف callback هشدار
   * @param {Function} callback
   */
  offAlert(callback) {
    this._alertCallbacks = this._alertCallbacks.filter(cb => cb !== callback);
  }

  /**
   * @private
   */
  _fireAlerts(report) {
    this._alertCallbacks.forEach(cb => {
      try {
        cb(report);
      } catch (e) {
        // Silently ignore alert callback errors
      }
    });
  }

  // ─────────────────────────── Reset ───────────────────────────

  /**
   * بازنشانی کامل مانیتور
   */
  reset() {
    this.stop();
    this.history = [];
    this.status = 'healthy';
    this.metrics = {
      uptime:          0,
      fps:             60,
      memoryUsageMB:   0,
      entityCount:     0,
      physicsStepMs:   0,
      renderStepMs:    0,
      collisionChecks: 0,
      activeLevel:     null,
      playerState:     null,
    };
    this._frameCount = 0;
    this._fpsTimer = 0;
    this._startTime = Date.now();
  }

  // ─────────────────────────── HTTP Response Helper ───────────────────────────

  /**
   * تولید پاسخ HTTP مناسب برای endpoint سلامت
   * @returns {{ statusCode: number, headers: Object, body: string }}
   */
  toHttpResponse() {
    const report = this.getReport();
    const statusCode = report.status === 'healthy' ? 200
                     : report.status === 'degraded' ? 503
                     : 500;

    return {
      statusCode,
      headers: {
        'Content-Type':    'application/json; charset=utf-8',
        'Cache-Control':   'no-cache, no-store, must-revalidate',
        'X-Health-Status': report.status,
        'X-Health-Checks': `${report.checks.filter(c => c.status === 'pass').length}/${report.checks.length}`,
      },
      body: JSON.stringify(report, null, 2),
    };
  }

  /**
   * تولید خروجی متنی برای CLI
   * @returns {string}
   */
  toText() {
    const report = this.evaluate();
    const lines = [];

    const statusEmoji = {
      healthy:  '🟢',
      degraded: '🟡',
      critical: '🔴',
    };

    lines.push(`${statusEmoji[report.status] || '⚪'} وضعیت: ${report.status.toUpperCase()}`);
    lines.push(`📅 زمان: ${report.isoTime}`);
    lines.push(`⏱  آپتایم: ${report.metrics.uptime.toFixed(1)}s`);
    lines.push('');
    lines.push('بررسی‌ها:');

    report.checks.forEach(check => {
      const icon = check.status === 'pass' ? '✅' : check.status === 'fail' ? '⚠️' : '❌';
      lines.push(`  ${icon} ${check.label}: ${check.value} (آستانه: ${check.threshold})`);
    });

    lines.push('');
    lines.push(report.summary);

    return lines.join('\n');
  }
}

// ─────────────────────────── Export ───────────────────────────
// Support both CommonJS and ES Module environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HealthMonitor;
}

// Browser global
if (typeof window !== 'undefined') {
  window.HealthMonitor = HealthMonitor;
}
```