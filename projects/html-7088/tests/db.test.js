/**
 * B2.st Mario Retro Game Engine - Automated Database & Security Test Pipeline
 * Unit and integration tests for Schemas, Sanitization, Crypto, Tamper Detection,
 * Migrations, Repositories, and Backups.
 * 
 * Execution: node tests/db.test.js
 */

const { DB_CONFIG } = require('../config/db.config.js');
const Schemas = require('../src/db/schema.js');
const Migrations = require('../src/db/migrations.js');
const {
  SecureDatabase,
  CryptoSecurity,
  SecurityTamperError,
  MemoryStorageAdapter
} = require('../src/db/database_layer.js');

// ANSI Terminal Colors for Test Reporter
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

let passedTests = 0;
let failedTests = 0;
const testSuiteStart = Date.now();

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message || 'Mismatch'}: expected [${expected}], got [${actual}]`);
  }
}

async function test(testName, fn) {
  try {
    await fn();
    console.log(`  ${GREEN}✓ PASS:${RESET} ${testName}`);
    passedTests++;
  } catch (err) {
    console.error(`  ${RED}✗ FAIL:${RESET} ${testName}`);
    console.error(`    ${RED}Error: ${err.message}${RESET}`);
    failedTests++;
  }
}

async function runAllTests() {
  console.log(`\n${BOLD}${CYAN}====================================================${RESET}`);
  console.log(`${BOLD}${CYAN}   B2.st MARIO ENGINE - DATABASE TEST SUITE         ${RESET}`);
  console.log(`${BOLD}${CYAN}====================================================${RESET}\n`);

  // ----------------------------------------------------
  // SUITE 1: SANITIZATION & PROTOTYPE POLLUTION DEFENSE
  // ----------------------------------------------------
  console.log(`${BOLD}${YELLOW}Suite 1: Sanitization & Anti-Tamper Security${RESET}`);

  await test('Sanitizer strips XSS script tags from user inputs', async () => {
    const malicious = '<script>alert("hack")</script>Player_One<img src=x onerror=alert(1)>';
    const cleaned = Schemas.Sanitizer.sanitizeString(malicious);
    assertEqual(cleaned, 'Player_One', 'XSS tags must be removed');
  });

  await test('Sanitizer blocks Prototype Pollution (__proto__, constructor)', async () => {
    const payload = JSON.parse('{"__proto__":{"polluted":true},"constructor":{"prototype":{"polluted":true}},"name":"Mario"}');
    const safeObj = Schemas.Sanitizer.sanitizeObject(payload);
    assert(!safeObj.polluted, 'Object must not be polluted');
    assert(!({}).polluted, 'Global prototype must not be polluted');
    assertEqual(safeObj.name, 'Mario', 'Legitimate fields must persist');
  });

  // ----------------------------------------------------
  // SUITE 2: SCHEMA VALIDATION RULES
  // ----------------------------------------------------
  console.log(`\n${BOLD}${YELLOW}Suite 2: Strict Schema Engine${RESET}`);

  await test('ProfileSchema validates correct payload and sets defaults', async () => {
    const valid = Schemas.ProfileSchema.validate({
      id: 'profile_test_1',
      username: 'Mario_Hero'
    });
    assertEqual(valid.username, 'Mario_Hero');
    assertEqual(valid.avatar, 'mario', 'Default avatar should be mario');
    assert(typeof valid.createdAt === 'number', 'CreatedAt must be timestamp');
  });

  await test('ProfileSchema throws ValidationError on invalid username format', async () => {
    let errorCaught = false;
    try {
      Schemas.ProfileSchema.validate({
        id: 'p1',
        username: 'A' // Too short (< 2)
      });
    } catch (e) {
      if (e instanceof Schemas.ValidationError) errorCaught = true;
    }
    assert(errorCaught, 'Expected ValidationError for short username');
  });

  await test('SaveStateSchema rejects negative lives or impossible score', async () => {
    let errorCaught = false;
    try {
      Schemas.SaveStateSchema.validate({
        id: 'save_p1_1',
        profileId: 'p1',
        slot: 1,
        world: 1,
        level: 1,
        score: -50, // Negative score invalid
        coins: 10,
        lives: 3
      });
    } catch (e) {
      if (e instanceof Schemas.ValidationError) errorCaught = true;
    }
    assert(errorCaught, 'Negative score must be rejected');
  });

  // ----------------------------------------------------
  // SUITE 3: CRYPTOGRAPHIC SIGNATURE & INTEGRITY ENGINE
  // ----------------------------------------------------
  console.log(`\n${BOLD}${YELLOW}Suite 3: SHA-256 Anti-Tamper Engine${RESET}`);

  await test('CryptoSecurity generates consistent deterministic hashes', async () => {
    const crypto = new CryptoSecurity();
    const dataA = { profileId: 'mario', score: 1000, world: 1 };
    const dataB = { world: 1, score: 1000, profileId: 'mario' }; // Different key order

    const sigA = await crypto.sign(dataA);
    const sigB = await crypto.sign(dataB);
    assertEqual(sigA, sigB, 'Hashes of identical keys in different order must match');
  });

  await test('CryptoSecurity detects unauthorized state modifications (Tamper)', async () => {
    const crypto = new CryptoSecurity();
    const saveState = {
      profileId: 'player_1',
      slot: 1,
      score: 500,
      world: 1,
      level: 1
    };

    const legitimateSignature = await crypto.sign(saveState);
    saveState.checksum = legitimateSignature;

    const isValidBefore = await crypto.verify(saveState, legitimateSignature);
    assert(isValidBefore, 'Legitimate signature must verify true');

    // Tamper with score
    saveState.score = 999999;
    const isValidAfter = await crypto.verify(saveState, legitimateSignature);
    assert(!isValidAfter, 'Tampered state must fail verification');
  });

  // ----------------------------------------------------
  // SUITE 4: AUTOMATIC MIGRATION SYSTEM
  // ----------------------------------------------------
  console.log(`\n${BOLD}${YELLOW}Suite 4: Database Migration Pipeline${RESET}`);

  await test('MigrationRunner executes V1, V2, V3 sequentially and seeds data', async () => {
    const adapter = new MemoryStorageAdapter(DB_CONFIG);
    await adapter.open();
    const crypto = new CryptoSecurity(DB_CONFIG.security.integritySalt);

    const runner = new Migrations.MigrationRunner();
    const applied = await runner.run(adapter, { cryptoSecurity: crypto });

    assertEqual(applied.length, 3, 'All 3 migrations must execute on clean DB');
    assertEqual(applied[0].version, 1);
    assertEqual(applied[1].version, 2);
    assertEqual(applied[2].version, 3);

    // Verify seed output
    const defaultSettings = await adapter.get('settings', DB_CONFIG.defaultSettings.id);
    assert(defaultSettings !== null, 'Settings must be seeded by migration');
    assertEqual(defaultSettings.masterVolume, 80);

    const guestProfile = await adapter.get('profiles', 'profile_guest_mario');
    assert(guestProfile !== null, 'Guest Mario profile must be seeded');
  });

  await test('MigrationRunner is idempotent (runs 0 migrations if already applied)', async () => {
    const adapter = new MemoryStorageAdapter(DB_CONFIG);
    await adapter.open();
    const crypto = new CryptoSecurity(DB_CONFIG.security.integritySalt);

    const runner = new Migrations.MigrationRunner();
    await runner.run(adapter, { cryptoSecurity: crypto });

    // Second run
    const secondRun = await runner.run(adapter, { cryptoSecurity: crypto });
    assertEqual(secondRun.length, 0, 'No migrations should execute when up to date');
  });

  // ----------------------------------------------------
  // SUITE 5: REPOSITORIES & CRUD OPERATIONS
  // ----------------------------------------------------
  console.log(`\n${BOLD}${YELLOW}Suite 5: Repositories & Data Access Layer${RESET}`);

  await test('ProfilesRepository prevents duplicate usernames', async () => {
    const db = new SecureDatabase({ useMemory: true });
    await db.initialize();

    await db.profiles.create({ username: 'Luigi_Bros', avatar: 'luigi' });

    let duplicateThrew = false;
    try {
      await db.profiles.create({ username: 'LUIGI_BROS', avatar: 'toad' });
    } catch (e) {
      if (e instanceof Schemas.ValidationError) duplicateThrew = true;
    }
    assert(duplicateThrew, 'Duplicate username must throw ValidationError');
  });

  await test('SaveStatesRepository saves, signs, and retrieves valid checkpoint', async () => {
    const db = new SecureDatabase({ useMemory: true });
    await db.initialize();

    const profile = await db.profiles.create({ username: 'Peach', avatar: 'peach' });

    const saved = await db.saves.saveSlot(profile.id, 2, {
      world: 2,
      level: 1,
      score: 14200,
      coins: 45,
      lives: 4,
      powerState: 'super',
      checkpointX: 520,
      checkpointY: 192,
      timeRemaining: 380
    });

    assert(saved.checksum.length === 64, 'Checksum must be valid 64-char SHA-256');

    const loaded = await db.saves.loadSlot(profile.id, 2);
    assertEqual(loaded.score, 14200);
    assertEqual(loaded.powerState, 'super');
    assertEqual(loaded.checkpointX, 520);
  });

  await test('SaveStatesRepository halts and throws SecurityTamperError on tampered save', async () => {
    const db = new SecureDatabase({ useMemory: true });
    await db.initialize();

    const profile = await db.profiles.create({ username: 'Toad_Runner', avatar: 'toad' });
    await db.saves.saveSlot(profile.id, 1, {
      world: 1,
      level: 2,
      score: 2500,
      coins: 12,
      lives: 3
    });

    // Simulate memory hack or manual indexedDB tampering
    await db.simulateTampering(profile.id, 1, 9999990);

    let tamperDetected = false;
    try {
      await db.saves.loadSlot(profile.id, 1);
    } catch (err) {
      if (err instanceof SecurityTamperError) {
        tamperDetected = true;
      }
    }

    assert(tamperDetected, 'Load slot must throw SecurityTamperError when save is tampered');
  });

  await test('HighScoresRepository signs score and returns ordered verified leaderboard', async () => {
    const db = new SecureDatabase({ useMemory: true });
    await db.initialize();

    await db.highScores.submitScore({
      profileId: 'p1',
      playerName: 'Player1',
      score: 10000,
      world: 1,
      level: 4,
      timeRemaining: 250
    });

    await db.highScores.submitScore({
      profileId: 'p2',
      playerName: 'Player2',
      score: 45000,
      world: 3,
      level: 1,
      timeRemaining: 190
    });

    await db.highScores.submitScore({
      profileId: 'p3',
      playerName: 'Player3',
      score: 23000,
      world: 2,
      level: 2,
      timeRemaining: 310
    });

    const leaderboard = await db.highScores.getLeaderboard(5);
    assertEqual(leaderboard.length, 3);
    assertEqual(leaderboard[0].playerName, 'Player2', 'Top score must be highest (45000)');
    assertEqual(leaderboard[1].playerName, 'Player3');
    assertEqual(leaderboard[2].playerName, 'Player1');
  });

  // ----------------------------------------------------
  // SUITE 6: BACKUP EXPORT & IMPORT
  // ----------------------------------------------------
  console.log(`\n${BOLD}${YELLOW}Suite 6: Database Backup & Restore Pipeline${RESET}`);

  await test('Database export creates cryptographically signed JSON snapshot', async () => {
    const db = new SecureDatabase({ useMemory: true });
    await db.initialize();

    const exportedJson = await db.exportDatabase();
    assert(typeof exportedJson === 'string');

    const parsed = JSON.parse(exportedJson);
    assertEqual(parsed.version, 3);
    assert(parsed.exportSignature.length === 64);
    assert(Array.isArray(parsed.stores.profiles));
  });

  await test('Database import restores exact data fidelity and rejects tampered backups', async () => {
    const dbA = new SecureDatabase({ useMemory: true });
    await dbA.initialize();
    await dbA.profiles.create({ username: 'Yoshi', avatar: 'toad' });

    const backupJson = await dbA.exportDatabase();

    // Import into fresh database B
    const dbB = new SecureDatabase({ useMemory: true });
    await dbB.initialize();
    await dbB.importDatabase(backupJson);

    const yoshi = await dbB.profiles.getByUsername('Yoshi');
    assert(yoshi !== null, 'Restored database must contain Yoshi');
    assertEqual(yoshi.username, 'Yoshi');

    // Attempt import with tampered payload
    const tamperedBackup = JSON.parse(backupJson);
    tamperedBackup.stores.profiles.push({ id: 'hacked', username: 'Hacker', avatar: 'mario' });
    const tamperedJson = JSON.stringify(tamperedBackup);

    let importRejected = false;
    try {
      await dbB.importDatabase(tamperedJson);
    } catch (err) {
      if (err instanceof SecurityTamperError) importRejected = true;
    }
    assert(importRejected, 'Tampered backup signature must be rejected');
  });

  // ----------------------------------------------------
  // TEST SUMMARY & METRICS
  // ----------------------------------------------------
  const duration = ((Date.now() - testSuiteStart) / 1000).toFixed(2);
  console.log(`\n${BOLD}${CYAN}====================================================${RESET}`);
  console.log(`${BOLD}Test Results: ${GREEN}${passedTests} Passed${RESET}, ${failedTests > 0 ? `${RED}${failedTests} Failed` : `${GREEN}0 Failed`}`);
  console.log(`Execution Time: ${duration}s`);
  console.log(`${BOLD}${CYAN}====================================================${RESET}\n`);

  if (failedTests > 0) {
    process.exit(1);
  }
}

// Execute test suite if run directly
if (typeof require !== 'undefined' && require.main === module) {
  runAllTests();
}

module.exports = { runAllTests };