/**
 * مجموعه تست‌های واحد خودکار برای محاسبات فیزیک، جاذبه و شخصیت‌ها
 * قابلیت اجرا در محیط‌های استاندارد Node.js یا مرورگر
 */
import { PhysicsEngine } from '../src/engine/Physics.js';
import { Player } from '../src/entities/Player.js';

function assert(condition, message) {
  if (!condition) {
    throw new Error(`[FAIL] ${message}`);
  }
  console.log(`[PASS] ${message}`);
}

export function runPhysicsTests() {
  console.log('--- آغاز اجرای پایپ‌لاین تست‌های فیزیک B2.st ---');

  // تست شماره ۱: تداخل دو جعبه AABB
  const boxA = { x: 10, y: 10, width: 20, height: 20 };
  const boxB = { x: 25, y: 25, width: 20, height: 20 };
  const boxC = { x: 100, y: 100, width: 20, height: 20 };

  assert(PhysicsEngine.checkAABB(boxA, boxB) === true, 'تداخل دو باکس متقاطع باید مثبت باشد');
  assert(PhysicsEngine.checkAABB(boxA, boxC) === false, 'دو باکس دور از هم نباید تداخل داشته باشند');

  // تست شماره ۲: بارگذاری شخصیت‌ها با ویژگی‌های اختصاصی
  const mario = new Player(0, 0, 'mario');
  const luigi = new Player(0, 0, 'luigi');
  const toad = new Player(0, 0, 'toad');
  const peach = new Player(0, 0, 'peach');

  assert(luigi.stats.jumpPower < mario.stats.jumpPower, 'پرش لوئیجی باید ارتفاع بیشتری نسبت به ماریو داشته باشد');
  assert(toad.stats.runSpeed > mario.stats.runSpeed, 'سرعت تود باید بیشتر از ماریو باشد');
  assert(peach.stats.canHover === true, 'پرنسس پیچ باید دارای قابلیت هاور در هوا باشد');

  // تست شماره ۳: شبیه‌سازی سقوط و اعمال گرانش
  const physics = new PhysicsEngine(32);
  const dummyLevel = {
    getTile(col, row) {
      if (row >= 10) return { solid: true };
      return null;
    }
  };

  const testEntity = { x: 50, y: 0, width: 28, height: 32, vx: 0, vy: 0, onGround: false };
  physics.updateEntityY(testEntity, dummyLevel);

  assert(testEntity.vy > 0, 'جاذبه باید سرعت عمودی را پس از یک فریم مثبت کند');
  assert(testEntity.y > 0, 'موقعیت عمودی باید رو به پایین تغییر کند');

  console.log('--- تمام تست‌های فیزیک با موفقیت سپری شدند! ---');
}

// در صورت اجرا به عنوان اسکریپت مستقل Node
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('physics.test.js')) {
  runPhysicsTests();
}