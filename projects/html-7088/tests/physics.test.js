/**
 * B2.st Mario Engine - Physics & Collision Unit Test Pipeline
 * Runnable via: node tests/physics.test.js
 */
import { Physics } from '../src/engine/Physics.js';
import { Vector2D } from '../src/engine/Vector2D.js';
import { GAME_CONFIG } from '../config/game.config.js';

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  \x1b[32m✔ PASS:\x1b[0m ${testName}`);
    passedTests++;
  } else {
    console.error(`  \x1b[31m✖ FAIL:\x1b[0m ${testName}`);
    failedTests++;
  }
}

console.log('\n======================================================');
console.log('  🧪 B2.st Super Mario Engine - Unit Tests Pipeline');
console.log('======================================================\n');

// --- TEST SUITE 1: 2D Vector Math ---
console.log('\x1b[36m[Suite 1] Vector2D Calculations\x1b[0m');
const v1 = new Vector2D(3, 4);
assert(v1.length() === 5, 'Vector length of (3,4) equals 5');

const v2 = new Vector2D(2, -1);
v1.add(v2);
assert(v1.x === 5 && v1.y === 3, 'Vector addition (3,4) + (2,-1) = (5,3)');

v1.scale(2);
assert(v1.x === 10 && v1.y === 6, 'Vector scalar multiplication (5,3) * 2 = (10,6)');

// --- TEST SUITE 2: AABB Bounding Box Overlaps ---
console.log('\n\x1b[36m[Suite 2] AABB Collision Detection\x1b[0m');
const marioBox = { x: 100, y: 150, width: 14, height: 16 };
const goombaBox = { x: 110, y: 155, width: 16, height: 16 };
const farObstacle = { x: 300, y: 150, width: 16, height: 16 };

assert(Physics.checkAABB(marioBox, goombaBox) === true, 'AABB detects overlap between Mario and nearby Goomba');
assert(Physics.checkAABB(marioBox, farObstacle) === false, 'AABB correctly rejects non-overlapping far object');

// Edge-touching case (should not register as penetrative collision)
const touchingBox = { x: 114, y: 150, width: 16, height: 16 };
assert(Physics.checkAABB(marioBox, touchingBox) === false, 'AABB handles tangent bounding edge non-penetration');

// --- TEST SUITE 3: Gravity and Kinematics ---
console.log('\n\x1b[36m[Suite 3] Gravity & Kinematic Acceleration\x1b[0m');
const mockEntity = {
  isGrounded: false,
  velocity: new Vector2D(0, 0),
  position: new Vector2D(50, 50)
};

const dt = 1 / 60;
Physics.applyGravity(mockEntity, GAME_CONFIG.PHYSICS.GRAVITY, GAME_CONFIG.PHYSICS.MAX_FALL_SPEED, dt);
const expectedVy = GAME_CONFIG.PHYSICS.GRAVITY * dt;
assert(Math.abs(mockEntity.velocity.y - expectedVy) < 0.001, `Gravity properly accelerates airborne body (${mockEntity.velocity.y.toFixed(2)} px/s)`);

// Terminal velocity clamping
mockEntity.velocity.y = 1000;
Physics.applyGravity(mockEntity, GAME_CONFIG.PHYSICS.GRAVITY, GAME_CONFIG.PHYSICS.MAX_FALL_SPEED, dt);
assert(mockEntity.velocity.y === GAME_CONFIG.PHYSICS.MAX_FALL_SPEED, `Maximum fall speed strictly clamped to ${GAME_CONFIG.PHYSICS.MAX_FALL_SPEED}`);

// --- TEST SUITE 4: TileMap Floor Snapping & Collision Resolution ---
console.log('\n\x1b[36m[Suite 4] TileMap Resolution & Ground Contact\x1b[0m');
const mockTileMap = {
  isSolid: (c, r) => (r === 10 ? true : false),
  onTileHitFromBelow: () => {}
};

const fallingEntity = {
  dt: 1 / 60,
  position: new Vector2D(100, 155), // approaching row 10 (y = 160)
  velocity: new Vector2D(0, 300),
  size: new Vector2D(14, 16),
  collisionOffset: new Vector2D(0, 0),
  isGrounded: false,
  getBounds() {
    return { x: this.position.x, y: this.position.y, width: this.size.x, height: this.size.y };
  }
};

Physics.resolveTileMapCollisions(fallingEntity, mockTileMap, 16);
assert(fallingEntity.isGrounded === true, 'Entity is grounded after colliding with solid floor');
assert(fallingEntity.velocity.y === 0, 'Vertical velocity reset to 0 upon floor contact');
assert(fallingEntity.position.y === 10 * 16 - fallingEntity.size.y, 'Entity y-coordinate snapped cleanly to top of tile');

// --- TEST SUITE 5: Goomba Stomp vs Hurt Logic ---
console.log('\n\x1b[36m[Suite 5] Stomp Mechanics Differentiation\x1b[0m');
function evaluateHit(marioY, marioVy, goombaY) {
  const isFalling = marioVy > 0;
  const isAbove = (marioY + 16 - 8) < (goombaY + 6);
  return isFalling && isAbove ? 'STOMP' : 'HURT';
}

const stompCase = evaluateHit(140, 150, 150);
assert(stompCase === 'STOMP', 'Mario falling from above triggers Goomba STOMP');

const sideHitCase = evaluateHit(150, 0, 150);
assert(sideHitCase === 'HURT', 'Horizontal collision triggers Mario HURT / DEATH');

console.log('\n======================================================');
console.log(`  Summary: Total: ${passedTests + failedTests} | \x1b[32mPassed: ${passedTests}\x1b[0m | \x1b[31mFailed: ${failedTests}\x1b[0m`);
console.log('======================================================\n');

if (failedTests > 0) {
  process.exit(1);
}