/**
 * Lightweight Zero-Dependency BDD Test Framework
 * Provides describe, it, beforeEach, afterEach, and assertions for Node.js / Browser.
 * B2.st Studio
 */

const ANSI = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  bold: '\x1b[1m',
  dim: '\x1b[2m'
};

class AssertionFailure extends Error {
  constructor(message) {
    super(message);
    this.name = 'AssertionFailure';
  }
}

class Expectation {
  constructor(actual) {
    this.actual = actual;
  }

  toBe(expected) {
    if (this.actual !== expected) {
      throw new AssertionFailure(
        `Expected ${ANSI.cyan}${JSON.stringify(expected)}${ANSI.reset} but got ${ANSI.red}${JSON.stringify(this.actual)}${ANSI.reset}`
      );
    }
  }

  notToBe(expected) {
    if (this.actual === expected) {
      throw new AssertionFailure(
        `Expected NOT ${ANSI.cyan}${JSON.stringify(expected)}${ANSI.reset}`
      );
    }
  }

  toEqual(expected) {
    const actStr = JSON.stringify(this.actual);
    const expStr = JSON.stringify(expected);
    if (actStr !== expStr) {
      throw new AssertionFailure(
        `Expected deep equality:\n  Expected: ${ANSI.cyan}${expStr}${ANSI.reset}\n  Actual:   ${ANSI.red}${actStr}${ANSI.reset}`
      );
    }
  }

  toBeCloseTo(expected, delta = 0.01) {
    const diff = Math.abs(this.actual - expected);
    if (diff > delta) {
      throw new AssertionFailure(
        `Expected ${this.actual} to be close to ${expected} (within ±${delta}, diff: ${diff})`
      );
    }
  }

  toBeTruthy() {
    if (!this.actual) {
      throw new AssertionFailure(`Expected truthy value but got: ${this.actual}`);
    }
  }

  toBeFalsy() {
    if (this.actual) {
      throw new AssertionFailure(`Expected falsy value but got: ${this.actual}`);
    }
  }

  toBeGreaterThan(expected) {
    if (this.actual <= expected) {
      throw new AssertionFailure(`Expected ${this.actual} > ${expected}`);
    }
  }

  toBeLessThan(expected) {
    if (this.actual >= expected) {
      throw new AssertionFailure(`Expected ${this.actual} < ${expected}`);
    }
  }

  toBeGreaterThanOrEqual(expected) {
    if (this.actual < expected) {
      throw new AssertionFailure(`Expected ${this.actual} >= ${expected}`);
    }
  }

  toBeLessThanOrEqual(expected) {
    if (this.actual > expected) {
      throw new AssertionFailure(`Expected ${this.actual} <= ${expected}`);
    }
  }

  toContain(item) {
    if (!Array.isArray(this.actual) && typeof this.actual !== 'string') {
      throw new AssertionFailure(`Expected iterable, got ${typeof this.actual}`);
    }
    if (!this.actual.includes(item)) {
      throw new AssertionFailure(`Expected collection to contain ${JSON.stringify(item)}`);
    }
  }

  toThrow(expectedMsg = null) {
    if (typeof this.actual !== 'function') {
      throw new AssertionFailure('Expected a function to test for throwing');
    }
    let threw = false;
    let thrownError = null;
    try {
      this.actual();
    } catch (e) {
      threw = true;
      thrownError = e;
    }
    if (!threw) {
      throw new AssertionFailure('Function did not throw an error');
    }
    if (expectedMsg && !thrownError.message.includes(expectedMsg)) {
      throw new AssertionFailure(
        `Expected error message "${thrownError.message}" to include "${expectedMsg}"`
      );
    }
  }
}

const testSuites = [];
let currentSuite = null;

export function describe(name, fn) {
  const suite = {
    name,
    tests: [],
    beforeEachFns: [],
    afterEachFns: []
  };
  const prevSuite = currentSuite;
  currentSuite = suite;
  testSuites.push(suite);
  fn();
  currentSuite = prevSuite;
}

export function beforeEach(fn) {
  if (currentSuite) {
    currentSuite.beforeEachFns.push(fn);
  }
}

export function afterEach(fn) {
  if (currentSuite) {
    currentSuite.afterEachFns.push(fn);
  }
}

export function it(testName, fn) {
  if (currentSuite) {
    currentSuite.tests.push({ name: testName, fn });
  }
}

export function expect(actual) {
  return new Expectation(actual);
}

export async function runTests() {
  console.log(`\n${ANSI.bold}${ANSI.cyan}====================================================${ANSI.reset}`);
  console.log(`${ANSI.bold}  B2.st Studio - Super Mario Automated Test Pipeline  ${ANSI.reset}`);
  console.log(`${ANSI.bold}${ANSI.cyan}====================================================${ANSI.reset}\n`);

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  const startTime = Date.now();

  for (const suite of testSuites) {
    console.log(`${ANSI.bold}Suite: ${suite.name}${ANSI.reset}`);

    for (const test of suite.tests) {
      totalTests++;
      try {
        for (const bFn of suite.beforeEachFns) bFn();
        await test.fn();
        for (const aFn of suite.afterEachFns) aFn();

        console.log(`  ${ANSI.green}✓${ANSI.reset} ${ANSI.dim}${test.name}${ANSI.reset}`);
        passedTests++;
      } catch (err) {
        console.log(`  ${ANSI.red}✗ ${test.name}${ANSI.reset}`);
        console.log(`    ${ANSI.red}${err.message}${ANSI.reset}`);
        if (err.stack && !(err instanceof AssertionFailure)) {
          console.log(`    ${ANSI.dim}${err.stack}${ANSI.reset}`);
        }
        failedTests++;
      }
    }
    console.log('');
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(3);
  console.log(`${ANSI.bold}----------------------------------------------------${ANSI.reset}`);
  console.log(
    `Tests:  ${passedTests > 0 ? ANSI.green : ''}${passedTests} passed${ANSI.reset}, ` +
    `${failedTests > 0 ? ANSI.red : ''}${failedTests} failed${ANSI.reset}, ` +
    `${totalTests} total`
  );
  console.log(`Time:   ${duration}s`);
  console.log(`${ANSI.bold}----------------------------------------------------${ANSI.reset}\n`);

  if (failedTests > 0) {
    if (typeof process !== 'undefined') process.exit(1);
    return false;
  }
  return true;
}