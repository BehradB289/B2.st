/**
 * Test Pipeline - اجرای تست‌های مستقل بدون وابستگی خارجی برای موتور فیزیک و Gameloop
 * قابلیت اجرا مستقیم با: node tests/physics.test.js
 */
import { Vector2D } from '../src/engine/Vector2D.js';
import { BoundingBox, RigidBody, PhysicsEngine } from '../src/engine/Physics.js';
import { InputHandler } from '../src/engine/InputHandler.js';
import { GameLoop } from '../src/engine/GameLoop.js';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`  \x1b[32m✔ PASS:\x1b[0m ${testName}`);
    passedTests++;
  } else {
    console.error(`  \x1b[31m✖ FAIL:\x1b[0m ${testName}`);
    failedTests++;
  }
}

function suite(name, fn) {
  console.log(`\n\x1b[36m▶ TEST SUITE: ${name}\x1b[0m`);
  fn();
}

// ----------------------------------------------------
// ۱. تست محاسبات بردار دو بعدی Vector2D
// ----------------------------------------------------
suite('Vector2D Math & Operations', () => {
  const v1 = new Vector2D(3, 4);
  assert(v1.x === 3 && v1.y === 4, 'Initialization sets components properly');
  assert(v1.magnitude() === 5, 'Magnitude of (3,4) is 5');

  const v2 = new Vector2D(1, 2);
  v1.add(v2);
  assert(v1.x === 4 && v1.y === 6, 'Addition works: (3,4) + (1,2) = (4,6)');

  v1.scale(0.5);
  assert(v1.x === 2 && v1.y === 3, 'Scalar scaling works: (4,6) * 0.5 = (2,3)');

  const clone = v1.clone();
  assert(clone.x === 2 && clone.y === 3 && clone !== v1, 'Clone creates independent instance');
});

// ----------------------------------------------------
// ۲. تست جعبه محدودکننده و تداخل AABB
// ----------------------------------------------------
suite('AABB BoundingBox Collisions', () => {
  const boxA = new BoundingBox(10, 10, 20, 20); // x: 10..30, y: 10..30
  const boxB = new BoundingBox(25, 25, 20, 20); // تداخل دارد
  const boxC = new BoundingBox(35, 10, 20, 20); // بدون تداخل مجاور

  assert(boxA.intersects(boxB) === true, 'Overlapping bounding boxes return true');
  assert(boxA.intersects(boxC) === false, 'Separated bounding boxes return false');
  assert(boxA.contains(15, 15) === true, 'Point inside bounding box is detected');
  assert(boxA.contains(5, 5) === false, 'Point outside bounding box is rejected');
});

// ----------------------------------------------------
// ۳. تست گرانش و سرعت نهایی سقوط در PhysicsEngine
// ----------------------------------------------------
suite('Gravity & Terminal Velocity', () => {
  const engine = new PhysicsEngine({ gravity: 1000, terminalVelocity: 500 });
  const body = new RigidBody({ x: 0, y: 0, width: 16, height: 16 });
  engine.addBody(body);

  // شبیه‌سازی 0.1 ثانیه
  engine.step(0.1);
  assert(body.velocity.y === 100, 'Velocity increases with gravity: 1000 * 0.1 = 100 px/s');

  // شبیه‌سازی ۱ ثانیه کامل برای رسیدن به سرعت نهایی
  for (let i = 0; i < 60; i++) {
    engine.step(1 / 60);
  }
  assert(body.velocity.y === 500, 'Terminal velocity cap is respected (capped at 500 px/s)');
});

// ----------------------------------------------------
// ۴. تست برخورد با زمین و تنظیم isGrounded در محور Y
// ----------------------------------------------------
suite('Axis-Separated Collision Resolution & Landing', () => {
  const engine = new PhysicsEngine({ gravity: 1000 });
  // زمین استاتیک در y = 100
  const ground = engine.addObstacle(0, 100, 200, 40);

  // انتیتی در ارتفاع y = 80 و ارتفاع آن 16 است (کف آن در 96 است)
  const mario = new RigidBody({ x: 20, y: 80, width: 16, height: 16, vx: 0, vy: 50 });
  engine.addBody(mario);

  let landEventTriggered = false;
  engine.on('land', () => {
    landEventTriggered = true;
  });

  // اجرای گام جهت فرود روی زمین
  engine.step(0.2);

  assert(mario.isGrounded === true, 'Entity is detected as grounded on platform');
  assert(mario.position.y === ground.top - mario.size.y, 'Entity position is snapped to obstacle top (84 px)');
  assert(mario.velocity.y === 0, 'Vertical velocity reset to 0 after landing');
  assert(landEventTriggered === true, 'Physical "land" event dispatched successfully');
});

// ----------------------------------------------------
// ۵. تست مقاومت اصطکاکی افقی
// ----------------------------------------------------
suite('Ground Friction Deceleration', () => {
  const engine = new PhysicsEngine({ groundFriction: 600 });
  engine.addObstacle(0, 100, 300, 40);

  const runner = new RigidBody({ x: 10, y: 84, width: 16, height: 16, vx: 300, vy: 0 });
  runner.isGrounded = true;
  engine.addBody(runner);

  // یک ثانیه گذشت زمان
  engine.step(0.2);
  assert(runner.velocity.x === 180, 'Velocity reduced by ground friction (300 - 600*0.2 = 180)');

  engine.step(0.5);
  assert(runner.velocity.x === 0, 'Velocity completely stops without drifting negative');
});

// ----------------------------------------------------
// ۶. تست سیستم ورودی InputHandler
// ----------------------------------------------------
suite('InputHandler Actions & State', () => {
  const input = new InputHandler();

  assert(input.isDown('jump') === false, 'Jump initial state is false');

  input.simulateKeyDown('Space');
  assert(input.isDown('jump') === true, 'Jump is down after Space key press');
  assert(input.isJustPressed('jump') === true, 'isJustPressed is true on initial frame');

  input.update();
  assert(input.isDown('jump') === true, 'Jump remains down across frames');
  assert(input.isJustPressed('jump') === false, 'isJustPressed cleared after update()');

  input.simulateKeyUp('Space');
  assert(input.isDown('jump') === false, 'Jump is no longer down after release');
  assert(input.isJustReleased('jump') === true, 'isJustReleased marked for current frame');
});

// ----------------------------------------------------
// ۷. تست منطق Fixed Timestep در GameLoop
// ----------------------------------------------------
suite('GameLoop Timestep & Accumulator', () => {
  let updateTicks = 0;
  const loop = new GameLoop({
    targetFps: 60,
    onUpdate: (dt) => {
      updateTicks++;
      assert(Math.abs(dt - 1 / 60) < 0.0001, 'GameLoop supplies exact 60Hz fixed delta time');
    }
  });

  loop.start();
  // شبیه‌سازی گذشت 33.3 میلی‌ثانیه (باید 2 گام آپدیت فیزیک بزند)
  loop.tick(100);
  loop.tick(133.34);
  loop.stop();

  assert(updateTicks === 2, `Accumulator executed exactly 2 fixed updates (got ${updateTicks})`);
});

// ----------------------------------------------------
// خلاصه نهایی نتایج
// ----------------------------------------------------
console.log('\n========================================');
console.log(`Test Execution Finished: ${passedTests}/${totalTests} Passed`);
if (failedTests > 0) {
  console.error(`\x1b[31mStatus: FAILED (${failedTests} tests failed)\x1b[0m`);
  process.exit(1);
} else {
  console.log('\x1b[32mStatus: ALL TESTS PASSED SUCCESSFULLY! Ready for production deployment.\x1b[0m');
  process.exit(0);
}