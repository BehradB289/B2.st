/**
 * استودیو B2.st - پایپ‌لاین تست‌های واحد سیستم فیزیک، اینرسی و برخورد
 * قابلیت اجرا مستقیم در Node.js: `node tests/physics.test.js`
 */
import { Vector2D } from '../src/engine/Vector2D.js';
import { Physics } from '../src/engine/Physics.js';
import { Mario, MARIO_FORMS, MARIO_STATES } from '../src/entities/Mario.js';
import { Goomba, GOOMBA_STATES } from '../src/entities/Goomba.js';

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName) {
    if (condition) {
        console.log(`\x1b[32m✔ [PASSED]\x1b[0m ${testName}`);
        passedTests++;
    } else {
        console.error(`\x1b[31m✖ [FAILED]\x1b[0m ${testName}`);
        failedTests++;
    }
}

console.log('\n=========================================');
console.log('   B2.st ENGINE - PHYSICS UNIT TESTS     ');
console.log('=========================================\n');

// تست ۱: عملیات ریاضی بردارها
const v1 = new Vector2D(10, 20);
const v2 = new Vector2D(5, 5);
v1.add(v2);
assert(v1.x === 15 && v1.y === 25, 'Vector2D addition calculates correctly');

// تست ۲: سیستم AABB Collision
const boxA = { pos: new Vector2D(0, 0), size: new Vector2D(16, 16) };
const boxB = { pos: new Vector2D(10, 10), size: new Vector2D(16, 16) };
const boxC = { pos: new Vector2D(100, 100), size: new Vector2D(16, 16) };

assert(Physics.checkAABB(boxA, boxB) === true, 'AABB detects overlap correctly');
assert(Physics.checkAABB(boxA, boxC) === false, 'AABB correctly ignores distant boxes');

// تست ۳: تغییر فرم ماریو به Super Mario و مقیاس انتیتی
const mario = new Mario(50, 100, null);
assert(mario.form === MARIO_FORMS.SMALL && mario.size.y === 16, 'Mario starts as Small Mario (16x16)');
mario.upgradeToSuper();
assert(mario.form === MARIO_FORMS.SUPER && mario.size.y === 32, 'Mario upgrades to Super Mario (16x32)');

// تست ۴: برخورد تهاجمی (Stomp Attack) به گومبا
const testMario = new Mario(100, 90, null);
testMario.vel.y = 150; // سقوط رو به پایین
const goomba = new Goomba(100, 100);

testMario.checkEnemyCollisions([goomba]);

assert(goomba.state === GOOMBA_STATES.SQUISHED, 'Mario stomp squishes Goomba correctly');
assert(testMario.vel.y < 0, 'Mario bounces upward after stomping an enemy');
assert(testMario.score === 100, 'Mario gains 100 points on successful stomp');

// تست ۵: اینرسی و ترمز معکوس ماریو (Skidding FSM)
const runMario = new Mario(0, 0, null);
runMario.isGrounded = true;
runMario.vel.x = 80; // در حال حرکت به راست
runMario.handleInput({
    keys: { left: true, right: false, run: false, jump: false, down: false },
    isPressed: () => false
}, 0.016);

assert(runMario.state === MARIO_STATES.SKIDDING, 'Mario enters SKIDDING state when pressing opposite direction');

console.log(`\nResults: ${passedTests} Passed, ${failedTests} Failed.`);
if (failedTests > 0) {
    process.exit(1);
} else {
    console.log('\x1b[32mAll physics and state engine tests passed successfully!\x1b[0m\n');
}