/**
 * مجموعه تست‌های جامع واحد و یکپارچگی لایه پایگاه‌داده و امنیت B2.st
 * @module tests/database_layer.test
 */

import { DatabaseLayer } from '../src/db/database_layer.js';
import { CryptoSecurity } from '../src/db/crypto.js';
import { SaveRepository } from '../src/db/repositories/save_repository.js';
import { ProfileRepository } from '../src/db/repositories/profile_repository.js';
import { DATABASE_CONFIG } from '../config/database_config.js';

export async function runDatabaseTestSuite() {
  console.log('--- [B2.st Super Mario DB Test Suite] Starting Execution ---');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (!condition) {
      failed++;
      console.error(`❌ Assertion Failed: ${message}`);
      throw new Error(message);
    } else {
      passed++;
      console.log(`✅ Passed: ${message}`);
    }
  }

  try {
    const dbLayer = new DatabaseLayer();
    await dbLayer.initialize();
    assert(dbLayer.isOpen === true, 'Database connection successfully initialized.');

    // تست ۱: رمزنگاری و اعتبارسنجی یکپارچگی (Crypto & Tamper Check)
    const testRecord = {
      id: 'test_save_1',
      profileId: 'usr_mario',
      score: 50000,
      coins: 99
    };
    const signedRecord = await CryptoSecurity.signRecord(testRecord);
    assert(typeof signedRecord.checksum === 'string', 'Checksum successfully attached to record.');

    const isValid = await CryptoSecurity.verifyRecordIntegrity(signedRecord);
    assert(isValid === true, 'Digital signature properly verified on intact data.');

    // شبیه‌سازی تقلب بازیکن (دستکاری سکه‌ها)
    signedRecord.coins = 9999;
    const isTamperedValid = await CryptoSecurity.verifyRecordIntegrity(signedRecord);
    assert(isTamperedValid === false, 'Tampered data was successfully detected and rejected.');

    // تست ۲: اعتبارسنجی اسکیمای ذخیره بازی ماریو (Save Repository)
    const saveRepo = new SaveRepository(dbLayer);
    const savedSlot = await saveRepo.saveGameState({
      profileId: 'usr_tester_1',
      slotIndex: 0,
      world: 1,
      level: 2,
      score: 3400,
      coins: 25,
      lives: 3,
      marioState: 'super',
      checkpointX: 120,
      checkpointY: 180,
      playtime: 45
    });

    assert(savedSlot.id === 'save_usr_tester_1_slot_0', 'Save slot ID formatted correctly.');
    assert(savedSlot.marioState === 'super', 'Mario power-up state correctly stored.');

    // خواندن همان اسلات با تایید امضا
    const loadedSlot = await saveRepo.loadGameState('usr_tester_1', 0);
    assert(loadedSlot !== null, 'Loaded saved slot successfully from DB.');
    assert(loadedSlot.score === 3400, 'Score field corresponds to persisted data.');

    // تست ۳: پروفایل و تابلوی امتیازات (Profile Repository)
    const profileRepo = new ProfileRepository(dbLayer);
    const username = `MarioFan_${Date.now()}`;
    const newProfile = await profileRepo.createProfile(username);
    assert(newProfile.username === username, 'Profile generated and persisted.');

    await profileRepo.recordHighScore({
      profileId: newProfile.id,
      playerName: username,
      score: 125000,
      world: 8,
      level: 4
    });

    const topScores = await profileRepo.getTopScores(5);
    assert(topScores.length > 0, 'Top scores list retrieved.');
    assert(topScores[0].score >= 125000, 'Leaderboard properly sorted descending.');

    // تست ۴: تهیه نسخه پشتیبان و بازگردانی (Backup & Restore)
    const dump = await dbLayer.exportFullSnapshot();
    assert(typeof dump === 'string' && dump.includes('MarioFan'), 'Snapshot generated with valid signature.');

    const importResult = await dbLayer.importFullSnapshot(dump);
    assert(importResult === true, 'Snapshot verified and imported cleanly.');

    console.log(`\n========================================`);
    console.log(`🎉 [TEST SUITE COMPLETED] Passed: ${passed} | Failed: ${failed}`);
    console.log(`========================================\n`);
    return { success: failed === 0, passed, failed };
  } catch (error) {
    console.error('Fatal error during test suite execution:', error);
    return { success: false, passed, failed, error };
  }
}

// در صورت اجرا به صورت مستقل در محیط مرورگر یا تستی
if (typeof window !== 'undefined') {
  window.runMarioDbTests = runDatabaseTestSuite;
}