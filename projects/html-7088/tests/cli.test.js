```javascript
/**
 * ═══════════════════════════════════════════════════════════════
 *  🧪 تست‌های واحد — CLI Argument Parser
 * ═══════════════════════════════════════════════════════════════
 */

'use strict';

const { parseArgs } = require('../src/cli');

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

function run() {
  describe('parseArgs — Basic Commands', () => {
    it('باید دستور ساده را پارس کند', () => {
      // parseArgs expects argv (first 2 elements are node and script path)
      const result = parseArgs(['node', 'cli.js', 'status']);
      assertEqual(result.command, 'status', 'command');
    });

    it('باید بدون دستور کار کند', () => {
      const result = parseArgs(['node', 'cli.js']);
      assertEqual(result.command, null, 'no command');
    });
  });

  describe('parseArgs — Long Flags', () => {
    it('باید فلگ بولین را پارس کند', () => {
      const result = parseArgs(['node', 'cli.js', 'status', '--verbose']);
      assertEqual(result.flags.verbose, true, 'verbose flag');
    });

    it('باید فلگ با مقدار را پارس کند', () => {
      const result = parseArgs(['node', 'cli.js', 'build', '--level', '1-1']);
      assertEqual(result.flags.level, '1-1', 'level flag');
    });

    it('باید فلگ با = را پارس کند', () => {
      const result = parseArgs(['node', 'cli.js', 'config', '--set=debug=true']);
      assertEqual(result.flags.set, 'debug=true', 'set flag with =');
    });

    it('باید چند فلگ را همزمان پارس کند', () => {
      const result = parseArgs(['node', 'cli.js', 'build', '--level', '1-1', '--debug', '--minify']);
      assertEqual(result.flags.level, '1-1', 'level');
      assertEqual(result.flags.debug, true, 'debug');
      assertEqual(result.flags.minify, true, 'minify');
    });
  });

  describe('parseArgs — Short Flags', () => {
    it('باید فلگ کوتاه را پارس کند', () => {
      const result = parseArgs(['node', 'cli.js', 'health', '-v']);
      assertEqual(result.flags.v, true, 'short v flag');
      assertEqual(result.flags.verbose, true, 'verbose alias');
    });

    it('باید فلگ‌های کوتاه ترکیبی را پارس کند', () => {
      const result = parseArgs(['node', 'cli.js', 'test', '-vd']);
      assertEqual(result.flags.v, true, 'v flag');
      assertEqual(result.flags.d, true, 'd flag');
    });
  });

  describe('parseArgs — Positional Arguments', () => {
    it('باید آرگومان‌های موقعیتی را پارس کند', () => {
      const result = parseArgs(['node', 'cli.js', 'help', 'status']);
      assertEqual(result.command, 'help', 'command');
      assertEqual(result.positional[0], 'status', 'positional arg');
    });
  });

  describe('parseArgs — Double Dash Separator', () => {
    it('باید -- را به عنوان جداکننده بشناسد', () => {
      const result = parseArgs(['node', 'cli.js', 'test', '--', '--not-a-flag']);
      assertEqual(result.command, 'test', 'command');
      assertEqual(result.positional[0], '--not-a-flag', 'after -- is positional');
    });
  });

  console.log(`\n  ─────────────────────────────────`);
  console.log(`  ✅ ${_passCount} passed  ❌ ${_failCount} failed  📊 ${_testCount} total`);
  console.log('');

  if (_failCount > 0) {
    throw new Error(`${_failCount} test(s) failed`);
  }
}

module.exports = { run };

if (require.main === module) {
  run();
}
```