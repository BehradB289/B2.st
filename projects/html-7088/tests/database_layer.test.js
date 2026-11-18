/**
 * پایپ‌لاین آزمون‌های واحد لایه دیتابیس، سیستم Migration خودکار و امنیت ضد دستکاری
 * قابلیت اجرا مستقیم در ترمینال با: node tests/database_layer.test.js
 */
const { DatabaseConfig } = require('../config/database.config');
const { CryptoVault } = require('../src/db/security/crypto_vault');
const { BaseModel } = require('../src/db/models/base_model');
const { SaveStateModel } = require('../src/db/models/save_state_model');
const { HighScoreModel } = require('../src/db/models/high_score_model');
const { SettingsModel } = require('../src/db/models/settings_model');
const { DatabaseLayer } = require('../src/db/database_layer');

async function runTests() {
  console.log('\n========================================================');
  console.log('   استودیو B2.st | تست‌های جامع لایه امن دیتابیس و اسکیما');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      passed++;
      console.log(`  [PASS] ${message}`);
    } else {
      failed++;
      console.error(`  [FAIL] ${message}`);
    }
  }

  // ۱. تست ماژول رمزنگاری و هشینگ
  console.log('--- ۱. تست هسته رمزنگاری CryptoVault ---');
  const payload1 = { score: 5000, coins: 25, lives: 3 };
  const payload2 = { lives: 3, score: 5000, coins: 25 }; // جابجایی ترتیب کلیدها
  const sig1 = CryptoVault.sign(payload1, 'test_salt');
  const sig2 = CryptoVault.sign(payload2, 'test_salt');
  assert(sig1 === sig2, 'ترتیب کلیدها در آبجکت نباید در مقدار هش امضا تاثیری بگذارد (Canonical Sorting).');
  assert(CryptoVault.verify(payload1, sig1, 'test_salt'), 'تایید امضای اصیل باید نتیجه موفقیت‌آمیز برگرداند.');
  assert(!CryptoVault.verify(payload1, sig1, 'wrong_salt'), 'بررسی امضا با سالت نادرست باید رد شود.');

  // ۲. تست راه‌اندازی دیتابیس و اجرای مایگریشن‌های خودکار
  console.log('\n--- ۲. تست اجرای خودکار مایگریشن‌ها و مقداردهی اولیه ---');
  const db = new DatabaseLayer({ dbName: 'Test_DB_v1', salt: 'test_salt_secret' });
  await db.initialize();
  assert(db.isMemoryDriver === true, 'در محیط تست بدون مرورگر، درایور ذخیره در حافظه فعال می‌شود.');

  // ۳. تست ذخیره و بازیابی وضعیت بازی (SaveState)
  console.log('\n--- ۳. تست چرخه عمر فایل ذخیره و امضای دیجیتال ---');
  const saveState = new SaveStateModel({
    slotId: 'slot_hero_1',
    label: 'مرحله تست ۱-۱',
    mario: { x: 120, y: 160, powerState: 'super', isGrounded: true, facingRight: true },
    stats: { score: 9800, coins: 45, lives: 4, world: '1', level: '2', timeRemaining: 320 }
  });

  await db.saveStates.save(saveState);
  assert(saveState.signature !== null, 'هنگام ذخیره، امضای دیجیتال محاسبه و الحاق گردید.');

  const loaded = await db.saveStates.load('slot_hero_1');
  assert(loaded !== null, 'فایل ذخیره با موفقیت از دیتابیس بازخوانی شد.');
  assert(loaded.isValidIntegrity === true, 'اعتبارسنجی امضای اصالت فایل با موفقیت تایید شد.');
  assert(loaded.isTampered === false, 'فلگ دستکاری (isTampered) غیرفعال است.');

  // ۴. تست کشف دستکاری غیرمجاز داده (Anti-Tamper Detection)
  console.log('\n--- ۴. تست کشف دستکاری غیرمجاز داده (Anti-Cheat / Tamper Detection) ---');
  // شبیه‌سازی دستکاری مستقیم در لایه استور بدون امضای معتبر
  const rawData = await db.getRaw(DatabaseConfig.STORES.SAVE_STATES, 'slot_hero_1');
  rawData.stats.score = 999999; // تغییر امتیاز توسط متقلب
  await db.putRaw(DatabaseConfig.STORES.SAVE_STATES, rawData);

  const tamperedLoad = await db.saveStates.load('slot_hero_1');
  assert(tamperedLoad.isValidIntegrity === false, 'تغییر غیرمجاز داده باید باعث شکست در تایید امضا شود.');
  assert(tamperedLoad.isTampered === true, 'سیستم باید فایل دستکاری‌شده را با فلگ isTampered: true علامت‌گذاری کند.');

  // ۵. تست ثبت و مرتب‌سازی تابلوی امتیازات برتر (HighScores)
  console.log('\n--- ۵. تست اعتبارسنجی و رتبه‌بندی HighScores ---');
  await db.highScores.clear();
  await db.highScores.record(new HighScoreModel({ playerName: 'PLAYER_A', score: 2000, world: '1-1' }));
  await db.highScores.record(new HighScoreModel({ playerName: 'PLAYER_B', score: 8500, world: '1-2' }));
  await db.highScores.record(new HighScoreModel({ playerName: 'PLAYER_C', score: 5000, world: '1-1' }));

  const topScores = await db.highScores.getTop(2);
  assert(topScores.length === 2, 'محدودیت تعداد رکوردهای خروجی اعمال شد.');
  assert(topScores[0].playerName === 'PLAYER_B' && topScores[0].score === 8500, 'رکورد اول باید بالاترین امتیاز (8500) باشد.');
  assert(topScores[1].score === 5000, 'رکورد دوم باید به صورت نزولی مرتب شده باشد.');

  // ۶. تست خروجی پشتیبان و بازیابی یکپارچه
  console.log('\n--- ۶. تست پشتیبان‌گیری رمزنگاری شده و بازگردانی (Backup Export/Import) ---');
  const backupJson = await db.exportBackup();
  assert(typeof backupJson === 'string' && backupJson.includes('masterSignature'), 'فایل بکاپ تولید شده شامل امضای جامع است.');

  const importResult = await db.importBackup(backupJson);
  assert(importResult === true, 'بازگردانی پشتیبان معتبر با موفقیت انجام شد.');

  // تلاش برای بازیابی فایل پشتیبان دستکاری شده
  let backupObj = JSON.parse(backupJson);
  backupObj.highScores[0].score = 999999;
  let corruptedJson = JSON.stringify(backupObj);

  let errorCaught = false;
  try {
    await db.importBackup(corruptedJson);
  } catch (err) {
    errorCaught = true;
  }
  assert(errorCaught === true, 'سامانه باید از بازگردانی بکاپ مخدوش و فاقد امضای معتبر جلوگیری کند.');

  console.log('\n========================================================');
  console.log(`نتیجه نهایی: ${passed} تست قبول شد، ${failed} تست رد شد.`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('خطای اجرا در تست دیتابیس:', err);
  process.exit(1);
});