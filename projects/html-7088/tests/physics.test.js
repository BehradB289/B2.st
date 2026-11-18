/**
 * پایپ‌لاین تست‌های واحد موتور فیزیک AABB، برخوردها و گرانش
 * قابلیت اجرا مستقیم در ترمینال با: node tests/physics.test.js
 */
const { Vector2D, BoundingBox, PhysicsEngine } = require('../src/engine/physics');

function runPhysicsTests() {
  console.log('\n========================================================');
  console.log('   استودیو B2.st | تست‌های فیزیک، شتاب گرانش و برخورد AABB');
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

  // ۱. تست جعبه محصورکننده (BoundingBox)
  const box1 = new BoundingBox(10, 10, 16, 16);
  const box2 = new BoundingBox(20, 20, 16, 16);
  const box3 = new BoundingBox(50, 50, 16, 16);

  assert(box1.intersects(box2) === true, 'دو جعبه دارای همپوشانی باید برخورد را ثبت کنند.');
  assert(box1.intersects(box3) === false, 'دو جعبه دور از هم نباید برخورد ثبت کنند.');

  // ۲. تست گرانش و سرعت سقوط
  const physics = new PhysicsEngine({ gravity: 1000, terminalVelocity: 400 });
  const mockEntity = {
    position: new Vector2D(0, 0),
    velocity: new Vector2D(0, 0),
    isGrounded: false
  };

  physics.applyGravity(mockEntity, 0.1);
  assert(mockEntity.velocity.y === 100, 'اعمال گرانش 1000 در 0.1 ثانیه باید سرعت را به 100 برساند.');

  physics.applyGravity(mockEntity, 1.0);
  assert(mockEntity.velocity.y === 400, 'سرعت عمودی نباید از حداکثر سرعت سقوط (Terminal Velocity) عبور کند.');

  mockEntity.isGrounded = true;
  physics.applyGravity(mockEntity, 0.5);
  assert(mockEntity.velocity.y === 400, 'در صورت قرار داشتن روی زمین (isGrounded)، گرانش نباید اعمال شود.');

  console.log('\n========================================================');
  console.log(`نتیجه تست‌های فیزیک: ${passed} تست قبول شد، ${failed} تست رد شد.`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhysicsTests();