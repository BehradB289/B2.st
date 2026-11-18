/**
 * Lightweight, zero-dependency Test Runner & Assertion Library
 * Studio: B2.st
 */

class Expectation {
  constructor(actual) {
    this.actual = actual;
  }

  toBe(expected) {
    if (this.actual !== expected) {
      throw new Error(`Expected: ${JSON.stringify(expected)}\nReceived: ${JSON.stringify(this.actual)}`);
    }
  }

  toBeCloseTo(expected, delta = 0.05) {
    const diff = Math.abs(this.actual - expected);
    if (diff > delta) {
      throw new Error(`Expected ${this.actual} to be close to ${expected} within +/-${delta} (diff: ${diff.toFixed(4)})`);
    }
  }

  toBeTruthy() {
    if (!this.actual) {
      throw new Error(`Expected truthy value but got: ${this.actual}`);
    }
  }

  toBeFalsy() {
    if (this.actual) {
      throw new Error(`Expected falsy value but got: ${this.actual}`);
    }
  }

  toBeGreaterThan(expected) {
    if (this.actual <= expected) {
      throw new Error(`Expected ${this.actual} to be strictly greater than ${expected}`);
    }
  }

  toBeLessThan(expected) {
    if (this.actual >= expected) {
      throw new Error(`Expected ${this.actual} to be strictly less than ${expected}`);
    }
  }

  toContain(item) {
    if (!this.actual || typeof this.actual.includes !== 'function' || !this.actual.includes(item)) {
      throw new Error(`Expected sequence to contain ${item}`);
    }
  }
}

class TestSuite {
  constructor() {
    this.suites = [];
    this.currentSuite = null;
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
  }

  describe(title, fn) {
    const suite = {
      title,
      tests: [],
      beforeEachFns: []
    };
    this.suites.push(suite);
    this.currentSuite = suite;
    fn();
    this.currentSuite = null;
  }

  beforeEach(fn) {
    if (this.currentSuite) {
      this.currentSuite.beforeEachFns.push(fn);
    }
  }

  it(description, testFn) {
    if (this.currentSuite) {
      this.currentSuite.tests.push({ description, testFn });
    }
  }

  async run() {
    const isNode = typeof process !== 'undefined' && process.stdout;
    const colors = {
      reset: isNode ? '\x1b[0m' : '',
      green: isNode ? '\x1b[32m' : '',
      red: isNode ? '\x1b[31m' : '',
      cyan: isNode ? '\x1b[36m' : '',
      gray: isNode ? '\x1b[90m' : '',
      bold: isNode ? '\x1b[1m' : ''
    };

    console.log(`\n${colors.cyan}${colors.bold}=== B2.st Mario Automated Test Engine ===${colors.reset}\n`);
    const startTime = Date.now();

    for (const suite of this.suites) {
      console.log(`${colors.bold}Suite: ${suite.title}${colors.reset}`);

      for (const test of suite.tests) {
        this.totalTests++;
        try {
          for (const beforeFn of suite.beforeEachFns) {
            await beforeFn();
          }
          await test.testFn();
          this.passedTests++;
          console.log(`  ${colors.green}✔ PASS:${colors.reset} ${colors.gray}${test.description}${colors.reset}`);
        } catch (err) {
          this.failedTests++;
          console.log(`  ${colors.red}✖ FAIL:${colors.reset} ${test.description}`);
          console.log(`    ${colors.red}${err.message}${colors.reset}\n`);
        }
      }
      console.log('');
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(3);
    console.log(`${colors.cyan}--------------------------------------------------${colors.reset}`);
    console.log(
      `Results: ${colors.green}${this.passedTests} passed${colors.reset}, ` +
      `${this.failedTests > 0 ? colors.red : colors.gray}${this.failedTests} failed${colors.reset}, ` +
      `total: ${this.totalTests} (${duration}s)`
    );

    if (this.failedTests > 0 && typeof process !== 'undefined') {
      process.exitCode = 1;
    }
    return { passed: this.passedTests, failed: this.failedTests, total: this.totalTests };
  }
}

export const runner = new TestSuite();
export const describe = (title, fn) => runner.describe(title, fn);
export const it = (desc, fn) => runner.it(desc, fn);
export const beforeEach = (fn) => runner.beforeEach(fn);
export const expect = (val) => new Expectation(val);
export const runAll = () => runner.run();