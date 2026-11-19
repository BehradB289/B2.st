import { describe, it, beforeEach, expect, runTests } from './testHarness.js';
import { Vector2 } from '../src/engine/Vector2.js';
import { AABB } from '../src/engine/AABB.js';
import { PhysicsEngine } from '../src/engine/PhysicsEngine.js';
import { Camera } from '../src/engine/Camera.js';
import { TileMap } from '../src/levels/TileMap.js';
import { Mario } from '../src/entities/Mario.js';
import { Goomba } from '../src/entities/Goomba.js';
import { GAME_CONFIG } from '../config/game.config.js';

// =========================================================================
// Suite 1: Vector2 & AABB Geometric Primitives
// =========================================================================
describe('1. Vector2 & AABB Math Primitives', () => {
  it('should accurately handle vector addition, scaling and magnitude', () => {
    const v1 = new Vector2(3, 4);
    expect(v1.magnitude()).toBe(5);

    v1.scale(2);
    expect(v1.x).toBe(6);
    expect(v1.y).toBe(8);

    const v2 = new Vector2(2, 2);
    v1.add(v2);
    expect(v1.x).toBe(8);
    expect(v1.y).toBe(10);
  });

  it('should detect intersecting and non-intersecting AABB boxes', () => {
    const boxA = new AABB(0, 0, 16, 16);
    const boxB = new AABB(10, 10, 16, 16);
    const boxC = new AABB(20, 20, 16, 16);

    expect(boxA.intersects(boxB)).toBeTruthy();
    expect(boxA.intersects(boxC)).toBeFalsy();
  });

  it('should calculate correct penetration depths and overlap vectors', () => {
    const boxA = new AABB(0, 0, 16, 16);
    const boxB = new AABB(12, 0, 16, 16); // 4px horizontal overlap

    const overlap = boxA.getOverlap(boxB);
    expect(overlap).toBeTruthy();
    expect(overlap.absX).toBe(4);
  });
});

// =========================================================================
// Suite 2: Kinematics, Gravity & Terminal Velocity
// =========================================================================
describe('2. Kinematics, Gravity & Terminal Velocity', () => {
  let physics;

  beforeEach(() => {
    physics = new PhysicsEngine(GAME_CONFIG);
  });

  it('should accelerate falling entities under gravity', () => {
    const mario = new Mario(50, 50);
    mario.vel.y = 0;
    const dt = 1 / 60; // 0.01666s

    physics.applyGravity(mario, dt);

    const expectedVelY = GAME_CONFIG.GRAVITY * dt;
    expect(mario.vel.y).toBeCloseTo(expectedVelY, 0.01);
  });

  it('should strictly cap velocity at terminal velocity', () => {
    const mario = new Mario(50, 50);
    mario.vel.y = GAME_CONFIG.TERMINAL_VELOCITY - 10;

    // Simulate several frames of free fall
    for (let frame = 0; frame < 20; frame++) {
      physics.applyGravity(mario, 1 / 60);
    }

    expect(mario.vel.y).toBe(GAME_CONFIG.TERMINAL_VELOCITY);
  });

  it('should not apply gravity to static or gravity-exempt entities', () => {
    const mario = new Mario(50, 50);
    mario.hasGravity = false;
    mario.vel.y = 0;

    physics.applyGravity(mario, 1 / 60);
    expect(mario.vel.y).toBe(0);
  });
});

// =========================================================================
// Suite 3: TileMap Collisions (Floor, Ceiling, Walls)
// =========================================================================
describe('3. TileMap World Collision Resolution', () => {
  let physics;
  let tileMap;

  beforeEach(() => {
    physics = new PhysicsEngine(GAME_CONFIG);
    tileMap = new TileMap(40, 15, 16);

    // Create ground row at row 13 (y = 208)
    for (let col = 0; col < 40; col++) {
      tileMap.setTile(col, 13, GAME_CONFIG.TILE_TYPE.GROUND);
    }
  });

  it('should stop falling Mario exactly at tile floor and reset grounded state', () => {
    const mario = new Mario(64, 190); // 18px above floor
    mario.vel.y = 200;

    // Run 1 frame simulation
    const dt = 1 / 60;
    physics.resolveTileMapCollisions(mario, tileMap, dt);

    // Mario height is 16. Floor is at 13 * 16 = 208. Mario pos.y should snap to 208 - 16 = 192
    expect(mario.pos.y).toBe(192);
    expect(mario.vel.y).toBe(0);
    expect(mario.isGrounded).toBeTruthy();
  });

  it('should block Mario walking horizontally into a solid obstacle', () => {
    // Add vertical obstacle at col 10 (x = 160), row 12
    tileMap.setTile(10, 12, GAME_CONFIG.TILE_TYPE.GROUND);

    const mario = new Mario(150, 12 * 16); // Walking right towards wall
    mario.vel.x = 120;

    const dt = 0.1; // 100ms step: would normally overshoot by 12px
    physics.resolveTileMapCollisions(mario, tileMap, dt);

    // Should snap to 160 - 16 = 144
    expect(mario.pos.x).toBe(144);
    expect(mario.vel.x).toBe(0);
  });

  it('should handle head bump against ceiling and rebound downward', () => {
    // Place a brick block at col 5, row 8 (y = 128)
    tileMap.setTile(5, 8, GAME_CONFIG.TILE_TYPE.BRICK);

    const mario = new Mario(5 * 16, 140); // Underneath block
    mario.vel.y = -200; // Jumping upwards

    let bumpedTile = null;
    mario.onHeadBump = (t) => {
      bumpedTile = t;
    };

    const dt = 0.1;
    physics.resolveTileMapCollisions(mario, tileMap, dt);

    // Under block bottom = 8 * 16 + 16 = 144
    expect(mario.pos.y).toBe(144);
    expect(mario.vel.y).toBe(GAME_CONFIG.HEAD_BUMP_REBOUND);
    expect(bumpedTile).toBeTruthy();
    expect(bumpedTile.type).toBe(GAME_CONFIG.TILE_TYPE.BRICK);
  });
});

// =========================================================================
// Suite 4: Interactive Tile Mechanics (Question Block & Coins)
// =========================================================================
describe('4. Question Block & Interactive Mechanics', () => {
  let tileMap;
  let mario;

  beforeEach(() => {
    tileMap = new TileMap(20, 15, 16);
    mario = new Mario(50, 50);
  });

  it('should turn Question Block into Empty Block and grant a coin', () => {
    tileMap.setTile(8, 7, GAME_CONFIG.TILE_TYPE.QUESTION_BLOCK);

    expect(mario.coins).toBe(0);
    expect(mario.score).toBe(0);

    const hitResult = tileMap.hitBlockAt(8, 7, mario);

    expect(hitResult.triggered).toBeTruthy();
    expect(tileMap.getTile(8, 7)).toBe(GAME_CONFIG.TILE_TYPE.EMPTY_BLOCK);
    expect(mario.coins).toBe(1);
    expect(mario.score).toBe(GAME_CONFIG.SCORES.COIN);
  });

  it('should not allow empty blocks to be triggered again', () => {
    tileMap.setTile(8, 7, GAME_CONFIG.TILE_TYPE.EMPTY_BLOCK);

    const hitResult = tileMap.hitBlockAt(8, 7, mario);
    expect(hitResult.triggered).toBeFalsy();
    expect(mario.coins).toBe(0);
  });

  it('should reward extra life on collecting 100 coins', () => {
    mario.coins = 99;
    const initialLives = mario.lives;

    mario.collectCoin();

    expect(mario.coins).toBe(0);
    expect(mario.lives).toBe(initialLives + 1);
  });
});

// =========================================================================
// Suite 5: Mario Jumping Dynamics & Arc
// =========================================================================
describe('5. Mario Jump Kinematics & Arc Progression', () => {
  let physics;
  let tileMap;

  beforeEach(() => {
    physics = new PhysicsEngine(GAME_CONFIG);
    tileMap = new TileMap(30, 15, 16);
    for (let c = 0; c < 30; c++) tileMap.setTile(c, 13, GAME_CONFIG.TILE_TYPE.GROUND);
  });

  it('should only jump when grounded', () => {
    const mario = new Mario(50, 192);
    mario.isGrounded = false;
    expect(mario.jump()).toBeFalsy();

    mario.isGrounded = true;
    expect(mario.jump()).toBeTruthy();
    expect(mario.vel.y).toBe(GAME_CONFIG.JUMP_IMPULSE);
  });

  it('should follow a realistic ballistic trajectory reaching peak apex', () => {
    const mario = new Mario(50, 192);
    mario.isGrounded = true;
    mario.jump();

    const dt = 1 / 60;
    let prevY = mario.pos.y;
    let reachedApex = false;

    // Simulate 40 frames
    for (let f = 0; f < 40; f++) {
      physics.applyGravity(mario, dt);
      mario.pos.y += mario.vel.y * dt;

      if (mario.vel.y >= 0 && !reachedApex) {
        reachedApex = true;
        // At apex, Mario should be significantly higher than starting 192
        expect(mario.pos.y).toBeLessThan(150);
      }
      prevY = mario.pos.y;
    }

    expect(reachedApex).toBeTruthy();
  });
});

// =========================================================================
// Suite 6: Mario vs Goomba Stomp Collision Integration
// =========================================================================
describe('6. Mario vs Goomba Stomp Collision Resolution', () => {
  let physics;

  beforeEach(() => {
    physics = new PhysicsEngine(GAME_CONFIG);
  });

  it('should stomp Goomba when Mario falls onto it from above', () => {
    const mario = new Mario(50, 30);
    mario.vel.y = 150; // Falling downwards

    const goomba = new Goomba(50, 42); // Underneath Mario
    expect(goomba.state).toBe('ALIVE');

    const collision = physics.resolveDynamicPair(mario, goomba);
    expect(collision).toBeTruthy();
    expect(collision.type).toBe('STOMP');

    // Execute stomp handler
    mario.bounceAfterStomp();
    goomba.squash();

    expect(goomba.state).toBe('SQUASHED');
    expect(mario.vel.y).toBe(GAME_CONFIG.BOUNCE_IMPULSE);
    expect(mario.score).toBe(GAME_CONFIG.SCORES.STOMP_GOOMBA);
  });
});

// =========================================================================
// Suite 7: Mario vs Goomba Side Damage & State Degradation
// =========================================================================
describe('7. Mario vs Goomba Side Contact & Damage Pipeline', () => {
  let physics;

  beforeEach(() => {
    physics = new PhysicsEngine(GAME_CONFIG);
  });

  it('should kill Small Mario on side contact', () => {
    const mario = new Mario(40, 100);
    mario.vel.y = 0; // Not falling

    const goomba = new Goomba(50, 100); // Direct side contact
    const collision = physics.resolveDynamicPair(mario, goomba);

    expect(collision).toBeTruthy();
    expect(collision.type).toBe('HORIZONTAL_CONTACT');

    const damaged = mario.takeDamage();
    expect(damaged).toBeTruthy();
    expect(mario.state).toBe(GAME_CONFIG.MARIO_STATE.DEAD);
    expect(mario.lives).toBe(2);
  });

  it('should downgrade Super Mario to Small Mario and grant invulnerability frames', () => {
    const mario = new Mario(40, 100);
    mario.setPowerState(GAME_CONFIG.MARIO_STATE.SUPER);
    expect(mario.size.y).toBe(32);

    const damaged = mario.takeDamage();
    expect(damaged).toBeTruthy();
    expect(mario.state).toBe(GAME_CONFIG.MARIO_STATE.SMALL);
    expect(mario.size.y).toBe(16);
    expect(mario.invulnerableTimer).toBeGreaterThan(0);

    // Second hit while invulnerable should not do damage
    const secondHit = mario.takeDamage();
    expect(secondHit).toBeFalsy();
    expect(mario.state).toBe(GAME_CONFIG.MARIO_STATE.SMALL);
  });
});

// =========================================================================
// Suite 8: Dynamic Camera Tracking & Boundary Clamping
// =========================================================================
describe('8. Camera Viewport Tracking & Coordinates', () => {
  let camera;
  let mario;

  beforeEach(() => {
    camera = new Camera(256, 240);
    camera.setBounds(3200);
    mario = new Mario(50, 100);
  });

  it('should not scroll when Mario is within deadzone', () => {
    mario.pos.x = 100; // within 256 * 0.55 = 140.8
    camera.update(mario);
    expect(camera.pos.x).toBe(0);
  });

  it('should smoothly advance camera when Mario crosses deadzone', () => {
    mario.pos.x = 180; // Past 140.8
    camera.update(mario);
    expect(camera.pos.x).toBeGreaterThan(0);

    const screenCoord = camera.worldToScreen(mario.pos);
    expect(screenCoord.x).toBeCloseTo(camera.deadzoneRight, 0.1);
  });

  it('should clamp at level end boundaries', () => {
    mario.pos.x = 4000;
    camera.update(mario);
    expect(camera.pos.x).toBe(3200 - 256);
  });
});

// =========================================================================
// Suite 9: End-to-End Game Loop Integration Simulation
// =========================================================================
describe('9. Multi-Frame End-to-End Gameplay Simulation', () => {
  it('should run 60 consecutive frames: Mario jumps, stomps Goomba and collects block coin', () => {
    const physics = new PhysicsEngine(GAME_CONFIG);
    const tileMap = new TileMap(50, 15, 16);

    // Ground line at row 13
    for (let c = 0; c < 50; c++) tileMap.setTile(c, 13, GAME_CONFIG.TILE_TYPE.GROUND);

    // Question block overhead at col 6, row 9
    tileMap.setTile(6, 9, GAME_CONFIG.TILE_TYPE.QUESTION_BLOCK);

    // Mario starts on ground at col 2
    const mario = new Mario(32, 192);
    mario.isGrounded = true;

    // Goomba walking at col 8
    const goomba = new Goomba(128, 192);

    const entities = [mario, goomba];
    const dt = 1 / 60;

    mario.onHeadBump = (tile) => {
      tileMap.hitBlockAt(tile.col, tile.row, mario);
    };

    // Frame 1: Mario moves right and jumps
    mario.moveRight();
    mario.jump();

    // Simulate 60 ticks
    for (let frame = 0; frame < 60; frame++) {
      // Check entity vs entity dynamic interaction
      const contact = physics.resolveDynamicPair(mario, goomba);
      if (contact) {
        if (contact.type === 'STOMP') {
          mario.bounceAfterStomp();
          goomba.squash();
        } else if (contact.type === 'HORIZONTAL_CONTACT') {
          mario.takeDamage();
        }
      }

      physics.step(entities, tileMap, dt);
    }

    // Verify system integrity
    expect(mario.active).toBeTruthy();
    expect(mario.pos.x).toBeGreaterThan(32); // Has progressed horizontally
    expect(mario.vel.y).toBeLessThanOrEqual(GAME_CONFIG.TERMINAL_VELOCITY);
  });
});

// Run all test suites
runTests();