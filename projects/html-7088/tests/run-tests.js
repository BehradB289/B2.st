/**
 * Studio B2.st - Standalone Test Pipeline Runner
 * Runs all unit tests via Node.js
 */
import { runPhysicsTests } from './physics.test.js';
import { runCollisionTests } from './collision.test.js';
import { runLevelTests } from './level.test.js';

class TestRunner {
  constructor() {
    this.currentSuite = '';
    this.passed = 0;
    this.failed = 0;
    this.results = [];
  }

  describe(suiteName, fn) {
    this.currentSuite = suiteName;
    console.log(`\n\x1b[1m\x1b[36m▶ Suite: ${suiteName}\x1b[0m`);
    fn();
  }

  test(testName, fn) {
    try {
      fn();
      this.passed++;
      console.log(`  \x1b[32m✔ PASS:\x1b[0m ${testName}`);
      this.results.push({ suite: this.currentSuite, name: testName, status: 'PASS' });
    } catch (err) {
      this.failed++;
      console.error(`  \x1b[31m✖ FAIL:\x1b[0m ${testName}`);
      console.error(`    \x1b[33mError: ${err.message}\x1b[0m`);
      this.results.push({ suite: this.currentSuite, name: testName, status: 'FAIL', error: err.message });
    }
  }

  assert(condition, message = 'Assertion condition failed') {
    if (!condition) {
      throw new Error(message);
    }
  }

  assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(message || `Expected [${expected}] but received [${actual}]`);
    }
  }
}

const runner = new TestRunner();
const startTime = performance.now();

console.log('\x1b[1m\x1b[35m=== Studio B2.st Test Pipeline Initialized ===\x1b[0m');

runPhysicsTests(runner);
runCollisionTests(runner);
runLevelTests(runner);

const duration = (performance.now() - startTime).toFixed(2);
console.log('\n========================================');
console.log(`📊 نتیجه تست‌ها: \x1b[32m${runner.passed} قبولی\x1b[0m | \x1b[31m${runner.failed} خطا\x1b[0m (${duration} ms)`);

if (runner.failed > 0) {
  console.log('\x1b[31m❌ پایپ‌لاین تست با خطا مواجه شد.\x1b[0m\n');
  process.exit(1);
} else {
  console.log('\x1b[32m✅ کلیه تست‌های واحد با موفقیت پاس شدند.\x1b[0m\n');
  process.exit(0);
}