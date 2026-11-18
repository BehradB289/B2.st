/**
 * Studio B2.st - Unit Tests for Physics, AABB, and Mario State Transitions
 * Can be run in Node.js (v16+) or imported directly into browser testing runners.
 */

import { Physics } from '../src/engine/Physics.js';
import { Mario } from '../src/entities/Mario.js';
import { Goomba, Koopa } from '../src/entities/Enemies.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

console.log('=== Running Studio B2.st Physics & Logic Tests ===\n');

// 1. Test AABB Collision Detection
{
  console.log('Test Suite 1: AABB Collision Mathematics');
  const boxA = { x: 10, y: 10, width: 16, height: 16 };
  const boxB = { x: 20, y: 10, width: 16, height: 16 };
  const boxC = { x: 100, y: 100, width: 16, height: 16 };

  assert(Physics.checkAABB(boxA, boxB) === true, 'Overlapping boxes detected');
  assert(Physics.checkAABB(boxA, boxC) === false, 'Disjoint boxes correctly report no collision');
}

// 2. Test Mario Powerup State Transitions
{
  console.log('\nTest Suite 2: Mario Powerup & Health Morphing');
  const mario = new Mario(50, 100);

  assert(mario.powerState === 'SMALL', 'Mario starts in SMALL form');
  assert(mario.height === 16, 'Small Mario height is 16px');

  mario.growToSuper();
  assert(mario.powerState === 'SUPER', 'Mushroom transforms Mario to SUPER');
  assert(mario.height === 32, 'Super Mario height is 32px');

  mario.growToFire();
  assert(mario.powerState === 'FIRE', 'Fire flower promotes to FIRE Mario');

  mario.takeDamage();
  assert(mario.powerState === 'SUPER', 'Damage to Fire Mario reverts to SUPER');
  assert(mario.isInvulnerable === true, 'Damage triggers temporary invulnerability');

  mario.isInvulnerable = false;
  mario.takeDamage();
  assert(mario.powerState === 'SMALL', 'Damage to Super Mario reverts to SMALL');
  assert(mario.height === 16, 'Small Mario height restored');
}

// 3. Test Koopa Shell Mechanic
{
  console.log('\nTest Suite 3: Koopa Shell Mechanics');
  const koopa = new Koopa(100, 100);
  const mario = new Mario(100, 90);

  assert(koopa.inShell === false, 'Koopa starts walking');
  koopa.stomp(mario);
  assert(koopa.inShell === true, 'First stomp puts Koopa into shell');
  assert(koopa.vx === 0, 'Stationary shell has 0 velocity');

  koopa.kick(1);
  assert(koopa.shellMoving === true, 'Kicking shell puts it in moving state');
  assert(koopa.vx > 200, 'Kicked shell moves at high speed');
}

console.log(`\n========================================`);
console.log(`Test Results: ${passed} Passed, ${failed} Failed.`);
if (failed === 0) {
  console.log('ALL SYSTEMS NOMINAL. Ready for deployment!');
} else {
  process.exit(1);
}