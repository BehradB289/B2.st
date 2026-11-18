/**
 * پایپ‌لاین تست‌های واحد موتور فیزیک AABB، دوربین و تعامل با تایل‌ها
 * قابل اجرا مستقیم در محیط Node.js: `node tests/physics.test.js`
 */
import { Camera } from '../src/engine/Camera.js';
import { Physics } from '../src/engine/Physics.js';
import { TileMap, TILE_TYPES } from '../src/levels/TileMap.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[\x1b[32mPASS\x1b[0m] ${message}`);
    passed++;
  } else {
    console.error(`[\x1b[31mFAIL\x1b[0m] ${message}`);
    failed++;
  }
}

console.log('--- شروع اجرای تست‌های واحد موتور B2.st ---\n');

// ۱. تست تشخیص همپوشانی AABB
{
  const boxA = { x: 10, y: 10, width: 20, height: 20 };
  const boxB = { x: 25, y: 25, width: 20, height: 20 };
  const boxC = { x: 40, y: 40, width: 10, height: 10 };

  assert(Physics.testAABB(boxA, boxB) === true, 'AABB باید برخورد دو مستطیل متداخل را شناسایی کند');
  assert(Physics.testAABB(boxA, boxC) === false, 'AABB نباید برای مستطیل‌های جدا برخورد شناسایی کند');
}

// ۲. تست دوربین و اسکرول یک‌طرفه (Forward-Only)
{
  const camera = new Camera(256, 240);
  camera.setBounds(0, 1000);

  // حرکت ماریو به جلو
  camera.follow({ pos: { x: 200 } });
  const initialCamX = camera.x;
  assert(initialCamX > 0, 'دوربین باید همراه با حرکت ماریو به جلو اسکرول کند');

  // تلاش برای برگشتن به عقب
  camera.follow({ pos: { x: 50 } });
  assert(camera.x === initialCamX, 'دوربین استاندارد NES نباید اجازه اسکرول به عقب را بدهد');
}

// ۳. تست Viewport Culling دوربین
{
  const camera = new Camera(256, 240);
  camera.x = 100;
  camera.y = 0;

  assert(camera.isVisible(120, 50, 16, 16) === true, 'آبجکت داخل دید دوربین باید Visible باشد');
  assert(camera.isVisible(10, 50, 16, 16) === false, 'آبجکت سمت چپ دوربین باید Culling شود');
  assert(camera.isVisible(400, 50, 16, 16) === false, 'آبجکت سمت راست دوربین باید Culling شود');
}

// ۴. تست تعامل سر کاراکتر با بلوک علامت سوال (Question Block)
{
  const tileMap = new TileMap(20, 15, 16);
  tileMap.setTile(5, 5, TILE_TYPES.QUESTION_COIN);

  let scoreAdded = 0;
  let coinsAdded = 0;
  const mockContext = {
    addScore: (s) => { scoreAdded += s; },
    addCoin: () => { coinsAdded += 1; }
  };

  const dummyPlayer = { pos: { x: 5 * 16, y: 6 * 16 } };
  tileMap.bumpTile(5, 5, dummyPlayer, mockContext);

  assert(tileMap.getTile(5, 5) === TILE_TYPES.QUESTION_EMPTY, 'تایل علامت سوال باید به بلوک خالی تبدیل شود');
  assert(coinsAdded === 1, 'ضربه به بلوک علامت سوال باید ۱ سکه اضافه کند');
  assert(scoreAdded === 200, 'ضربه به بلوک علامت سوال باید ۲۰۰ امتیاز اهدا کند');
  assert(tileMap.particles.length > 0, 'باید سکه جهنده در سیستم ذرات ایجاد شده باشد');
}

// ۵. تست خرد شدن بلوک آجری (Brick Block)
{
  const tileMap = new TileMap(20, 15, 16);
  tileMap.setTile(7, 5, TILE_TYPES.BRICK);

  tileMap.bumpTile(7, 5, {}, null);
  assert(tileMap.getTile(7, 5) === TILE_TYPES.EMPTY, 'آجر پس از متلاشی شدن باید به فضای خالی تبدیل شود');
  // ۴ قطعه خرده سنگ آجر + ۱ متن امتیاز شناور = ۵ موجودیت ذره
  assert(tileMap.particles.length === 5, 'تخریب آجر باید ۴ تکه خرده آجر و ۱ نمایشگر امتیاز ایجاد کند');
}

console.log(`\nنتایج تست: ${passed} موفق | ${failed} ناموفق`);
if (failed > 0) process.exit(1);