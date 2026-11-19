/**
 * Automated Unit Tests for Management CLI Tool
 * Layer: Tests (Layer 4)
 */

import assert from 'node:assert';
import { parseArgs, validateLevelStructure } from '../src/cli.js';

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

  console.log('\n--- Running CLI Subsystem Test Suite ---');

  // Test 1: CLI Argument Parsing
  await test('should accurately parse subcommands and multi-format flags', async () => {
    const raw = ['serve', '-p', '8080', '--host=0.0.0.0', '--verbose', 'extraPositional'];
    const parsed = parseArgs(raw);

    assert.strictEqual(parsed.command, 'serve');
    assert.strictEqual(parsed.flags.p, '8080');
    assert.strictEqual(parsed.flags.host, '0.0.0.0');
    assert.strictEqual(parsed.flags.verbose, true);
    assert.deepStrictEqual(parsed.positionals, ['extraPositional']);
  });

  // Test 2: Level Validator - Valid Level
  await test('should validate correct Mario level data structures', async () => {
    const validLevel = {
      name: 'World 1-1',
      width: 2,
      height: 2,
      tileSize: 16,
      playerSpawn: { x: 32, y: 192 },
      layers: {
        collision: [0, 0, 1, 1]
      }
    };

    const result = validateLevelStructure(validLevel);
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.issues.length, 0);
  });

  // Test 3: Level Validator - Incomplete Level
  await test('should catch missing spawn points and layer array length mismatches', async () => {
    const invalidLevel = {
      width: 4,
      height: 4,
      tileSize: 16,
      // Missing playerSpawn
      layers: {
        collision: [0, 1] // length is 2, expected 16
      }
    };

    const result = validateLevelStructure(invalidLevel);
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.issues.length, 2);
    assert.match(result.issues[0], /Collision layer length mismatch/);
    assert.match(result.issues[1], /Missing or invalid "playerSpawn"/);
  });

  return { total: passed + failed, passed, failed };
}

// Run immediately if executed via node directly
if (process.argv[1]?.endsWith('cli.test.js')) {
  runTests().then((res) => {
    process.exit(res.failed > 0 ? 1 : 0);
  });
}