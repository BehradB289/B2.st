```javascript
/**
 * B2.st Studio - Security Pre-flight Check
 * بررسی امنیتی قبل از دیپلوی
 */

'use strict';

const fs = require('fs');
const path = require('path');

const CHECKS = [];
let passed = 0;
let failed = 0;

function check(name, condition, fix) {
  if (condition) {
    console.log(`  ✅ ${name}`);
    passed++;
  } else {
    console.log(`  ❌ ${name}`);
    if (fix) console.log(`     → Fix: ${fix}`);
    failed++;
  }
}

console.log('╔══════════════════════════════════════════╗');
console.log('║  B2.st Studio - Security Pre-flight      ║');
console.log('╚══════════════════════════════════════════╝\n');

// Check 1: .env should not be committed
const gitignorePath = path.join(__dirname, '..', '.gitignore');
if (fs.existsSync(gitignorePath)) {
  const gitignore = fs.readFileSync(gitignorePath, 'utf8');
  check('.env is in .gitignore', gitignore.includes('.env'), 'Add .env to .gitignore');
} else {
  check('.gitignore exists', false, 'Create .gitignore file');
}

// Check 2: .env.example should exist
const envExamplePath = path.join(__dirname, '..', '.env.example');
check('.env.example exists', fs.existsSync(envExamplePath), 'Create .env.example as template');

// Check 3: .env.example should NOT contain real secrets
if (fs.existsSync(envExamplePath)) {
  const envExample = fs.readFileSync(envExamplePath, 'utf8');
  const hasRealKey = /API_KEY=\w{10,}/.test(envExample);
  check('.env.example has no real API keys', !hasRealKey, 'Remove real API keys from .env.example');
}

// Check 4: package.json exists and is valid
const pkgPath = path.join(__dirname, '..', 'package.json');
let pkg = null;
try {
  pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  check('package.json is valid JSON', true);
} catch (e) {
  check('package.json is valid JSON', false, 'Fix JSON syntax in package.json');
}

// Check 5: package.json has required fields
if (pkg) {
  check('package.json has name', !!pkg.name, 'Add "name" field');
  check('package.json has version', !!pkg.version, 'Add "version" field');
  check('package.json has license', !!pkg.license, 'Add "license" field');
  check('package.json has engines', !!pkg.engines, 'Add "engines" field for Node version');
}

// Check 6: No node_modules committed
const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
if (fs.existsSync(gitignorePath)) {
  const gitignore = fs.readFileSync(gitignorePath, 'utf8');
  check('node_modules in .gitignore', gitignore.includes('node_modules'), 'Add node_modules/ to .gitignore');
}

// Check 7: env_config.js exists
const envConfigPath = path.join(__dirname, 'env_config.js');
check('config/env_config.js exists', fs.existsSync(envConfigPath), 'Create env_config.js');

// Check 8: index.html exists
const indexPath = path.join(__dirname, '..', 'index.html');
check('index.html exists', fs.existsSync(indexPath), 'Create the main game HTML file');

// Results
console.log(`\n  ─────────────────────────────`);
console.log(`  Passed: ${passed} | Failed: ${failed}`);
console.log(`  Status: ${failed === 0 ? '✅ ALL CLEAR' : '⚠️  ISSUES FOUND'}\n`);

process.exit(failed > 0 ? 1 : 0);
```