/**
 * @file database.test.js
 * @description آزمون‌های واحد و یکپارچگی لایه پایگاه داده، اسکیمای امنیتی و چرخه مایگریشن
 */

import { DatabaseLayer } from '../src/db/database_layer.js';
import { DatabaseSecurity } from '../src/db/security.js';
import { SchemaValidator } from '../src/db/schemas.js';
import { DATABASE_CONFIG } from '../config/database.config.js';

export async function runDatabaseTests() {
  console.log('--- 🧪 STARTING DATABASE & SECURITY TEST SUITE ---');
  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, testName) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
    }
  }

  try {
    // تست شماره ۱: تولید هش و امضای دیجیتال
    const sampleData = { slotId: 'slot_1', score: 12000, world: 1, lives: 3 };
    const sealed = await DatabaseSecurity.sealRecord(sampleData);
    assert(typeof sealed._checksum === 'string' && sealed._checksum.length > 0, 'Crypto: Record sealing produces valid checksum');

    // تست شماره ۲: تشخیص عدم دستکاری رکورد معتبر
    const isIntegrityValid = await DatabaseSecurity.verifyRecordIntegrity(sealed);
    assert(isIntegrityValid === true, 'Security: Untampered record passes integrity verification');

    // تست شماره ۳: شناسایی دستکاری غیرمجاز داده (Tamper Detection)
    const tampered = { ...sealed, score: 9999999 }; // تغییر امتیاز توسط هکر در حافظه
    const isTamperedValid = await DatabaseSecurity.verifyRecordIntegrity(tampered);
    assert(isTamperedValid === false, 'Security: Tampered score is successfully detected & rejected');

    // تست شماره ۴: پالایش ورودی (Sanitization)
    const maliciousInput = '<script>alert("hacked")</script>Player1';
    const cleanInput = DatabaseSecurity.sanitizeString(maliciousInput);
    assert(!cleanInput.includes('<') && !cleanInput.includes('>'), 'Security: XSS payload sanitized correctly');

    // تست شماره ۵: اعتبارسنجی اسکیما (اعتبارسنجی مقادیر مجاز)
    const validSave = {
      slotId: 'slot_test',
      profileId: 'usr_1',
      world: 2,
      stage: 1,
      score: 4500,
      coins: 20,
      lives: 3,
      powerState: 'SUPER',
      checkpointX: 120,
      checkpointY: 400,
      updatedAt: Date.now()
    };
    const validRes = SchemaValidator.validate(DATABASE_CONFIG.STORES.GAME_SAVES, validSave);
    assert(validRes.valid === true, 'Schema: Valid game save passes validation');

    // تست شماره ۶: رد داده‌های نامعتبر توسط اسکیما (مثلاً سکه غیرمجاز و حالت نامعتبر کاراکتر)
    const invalidSave = {
      ...validSave,
      coins: 150, // حداکثر 99 است
      powerState: 'GOD_MODE' // خارج از enum تعریف شده
    };
    const invalidRes = SchemaValidator.validate(DATABASE_CONFIG.STORES.GAME_SAVES, invalidSave);
    assert(invalidRes.valid === false && invalidRes.errors.length >= 2, 'Schema: Invalid values caught by schema constraints');

    // تست شماره ۷: تست عملکرد دیتابیس و تراکنش‌ها (اگر IndexedDB در دسترس باشد)
    if (typeof indexedDB !== 'undefined') {
      const testDb = new DatabaseLayer('B2_Mario_Test_DB', DATABASE_CONFIG.DB_VERSION);
      await testDb.init();

      // ذخیره و بازیابی
      await testDb.saveGameState(validSave);
      const retrieved = await testDb.loadGameState('slot_test');
      assert(retrieved !== null && retrieved.score === 4500, 'DatabaseLayer: Game state saved and loaded successfully');

      // ذخیره رکورد امتیاز
      await testDb.recordHighScore('usr_1', 'MARIO_PRO', 78000, 3, 2);
      const topScores = await testDb.getTopHighScores(5);
      assert(topScores.length > 0 && topScores[0].score >= 78000, 'DatabaseLayer: Leaderboard queried and sorted correctly');

      // پاک‌سازی
      await testDb.delete(DATABASE_CONFIG.STORES.GAME_SAVES, 'slot_test');
      testDb.close();
      assert(true, 'DatabaseLayer: Cleanup completed without errors');
    } else {
      console.warn('⚠️ [SKIP] IndexedDB environment not available in this runtime for live IO tests.');
    }

  } catch (error) {
    console.error('❌ Test execution encountered an unhandled error:', error);
  }

  console.log(`--- 🏁 TESTS COMPLETED: ${passedTests}/${totalTests} Passed ---`);
  return { passed: passedTests === totalTests, passedTests, totalTests };
}

// اجرای خودکار در صورت فراخوانی مستقیم
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    runDatabaseTests();
  });
}