/**
 * Standalone Automated Unit Test Runner
 * Studio: B2.st
 * Compatible with Node.js and Browser environments without dependencies.
 */
export class TestRunner {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
    }

    test(name, fn) {
        this.tests.push({ name, fn });
    }

    async run() {
        console.log(`\n========================================`);
        console.log(`B2.st Test Runner: Executing ${this.tests.length} tests...`);
        console.log(`========================================\n`);

        for (const { name, fn } of this.tests) {
            try {
                await fn();
                this.passed++;
                console.log(`  [PASS] ${name}`);
            } catch (error) {
                this.failed++;
                console.error(`  [FAIL] ${name}`);
                console.error(`         Reason: ${error.message}`);
            }
        }

        console.log(`\n----------------------------------------`);
        console.log(`Summary: Passed: ${this.passed} | Failed: ${this.failed}`);
        console.log(`----------------------------------------\n`);

        return this.failed === 0;
    }
}

export function assertEqual(actual, expected, message = '') {
    if (actual !== expected) {
        throw new Error(`${message} Expected [${expected}] but got [${actual}]`);
    }
}

export function assertTrue(actual, message = '') {
    if (!actual) {
        throw new Error(`${message} Expected truthy value but got [${actual}]`);
    }
}

export function assertFalse(actual, message = '') {
    if (actual) {
        throw new Error(`${message} Expected falsy value but got [${actual}]`);
    }
}