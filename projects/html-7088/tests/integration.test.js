/**
 * Comprehensive Automated Integration Tests for Engine, Physics, and Entities
 * Studio: B2.st
 */

import { describe, it, beforeEach, expect, runAll } from './testRunner.js';
import { PhysicsEngine } from '../src/engine/PhysicsEngine.js';
import { TileMap } from '../src/levels/TileMap.js';
import { Mario } from '../src/entities/Mario.js';
import { Goomba } from '../src/entities/Goomba.js';
import { Camera } from '../src/engine/Camera.js';
import { InputHandler } from '../src/engine/InputHandler.js';
import { TILES, MARIO_CONFIG, SCORES } from '../config/constants.js';

describe('Integration Test: Gravity and Solid Ground Landing', () => {
  let map;
  let physics;
  let mario;

  beforeEach(() => {
    map = new TileMap(16, 20, 15);
    // Ground level at row 10 (y = 160)
    for (let c = 0; c < 20; c++) {
      map.setTile(c, 10, TILES.GROUND);
    }
    physics = new PhysicsEngine(map, 980);
    // Mario starts in mid-air above ground: row 6 (y = 96)
    mario = new Mario(32, 96);
  });

  it('pulls Mario downward due to continuous gravity acceleration', () => {
    const initialY = mario.y;
    physics.updateEntity(mario, 0.05);

    expect(mario.vy).toBeGreaterThan(0);
    expect(mario.y).toBeGreaterThan(initialY);
    expect(mario.isGrounded).toBeFalsy();
  });

  it('snaps Mario precisely to the ground surface and halts vertical velocity', () => {
    // Expected landing Y: 10 * 16 - 16 = 144
    for (let frame = 0; frame < 30; frame++) {
      physics.updateEntity(mario, 1 / 60);
    }

    expect(mario.y).toBe(144);
    expect(mario.vy).toBe(0);
    expect(mario.isGrounded).toBeTruthy();
  });
});

describe('Integration Test: Jump Trajectory and Ceiling Brick Interaction', () => {
  let map;
  let physics;
  let mario;

  beforeEach(() => {
    map = new TileMap(16, 20, 15);
    // Floor at row 10 (y = 160)
    for (let c = 0; c < 20; c++) {
      map.setTile(c, 10, TILES.GROUND);
    }
    // Question block above Mario at col 2, row 5 (y = 80)
    map.setTile(2, 5, TILES.QUESTION_BLOCK);
    physics = new PhysicsEngine(map, 980);

    // Mario placed on ground directly below Question Block (x = 32, y = 144)
    mario = new Mario(32, 144);
    mario.isGrounded = true;
  });

  it('executes jump upward impulse and rebounds immediately upon striking Question Block', () => {
    const input = new InputHandler();
    input.setKey('jump', true);
    mario.update(0.016, input);

    expect(mario.vy).toBe(MARIO_CONFIG.JUMP_FORCE);
    expect(mario.isGrounded).toBeFalsy();

    // Step physics upward until collision with ceiling tile at row 5 (bottom is at y = 96)
    let ceilingHitDetected = false;
    for (let i = 0; i < 20; i++) {
      physics.updateEntity(mario, 0.016);
      if (mario.y <= 96 && mario.vy === 0) {
        ceilingHitDetected = true;
        break;
      }
    }

    expect(ceilingHitDetected).toBeTruthy();
    // Verify question block was hit and transformed into an empty block
    expect(map.getTile(2, 5)).toBe(TILES.QUESTION_BLOCK_EMPTY);
    // Mario should have received 1 coin and score
    expect(mario.coins).toBe(1);
    expect(mario.score).toBe(SCORES.COIN);
  });
});

describe('Integration Test: Horizontal Obstacle Collision (Pipes and Walls)', () => {
  let map;
  let physics;
  let mario;
  let input;

  beforeEach(() => {
    map = new TileMap(16, 20, 15);
    // Floor at row 10 (y = 160)
    for (let c = 0; c < 20; c++) {
      map.setTile(c, 10, TILES.GROUND);
    }
    // Green Pipe obstacle at col 5, rows 8 and 9 (x = 80)
    map.setTile(5, 8, TILES.PIPE_TOP_LEFT);
    map.setTile(5, 9, TILES.PIPE_BODY_LEFT);

    physics = new PhysicsEngine(map, 980);
    // Mario positioned to the left of the pipe at x = 50, y = 144
    mario = new Mario(50, 144);
    mario.isGrounded = true;
    input = new InputHandler();
  });

  it('stops horizontal movement against the pipe without clipping through', () => {
    input.setKey('right', true);

    // Simulate running right towards the obstacle for 1 second
    for (let i = 0; i < 60; i++) {
      mario.update(1 / 60, input);
      physics.updateEntity(mario, 1 / 60);
    }

    // Pipe left edge is 5 * 16 = 80. Mario width is 14.
    // Mario right edge should align with pipe left edge: 80 - 14 = 66
    expect(mario.x).toBe(66);
    expect(mario.x + mario.width).toBe(80);
  });
});

describe('Integration Test: Mario Stomp Goomba Interaction', () => {
  let map;
  let physics;
  let mario;
  let goomba;

  beforeEach(() => {
    map = new TileMap(16, 20, 15);
    for (let c = 0; c < 20; c++) {
      map.setTile(c, 10, TILES.GROUND);
    }
    physics = new PhysicsEngine(map, 980);

    // Goomba standing on ground at x = 100, y = 144
    goomba = new Goomba(100, 144);
    goomba.isGrounded = true;

    // Mario falling from air directly above Goomba at x = 100, y = 130 with positive vy
    mario = new Mario(100, 130);
    mario.vy = 150;
  });

  it('squashes Goomba, bounces Mario upward, and rewards score points', () => {
    const initialScore = mario.score;
    const entities = [mario, goomba];

    physics.resolveEntityToEntity(mario, entities);

    // Goomba must be squashed and dead
    expect(goomba.isSquashed).toBeTruthy();
    expect(goomba.isAlive).toBeFalsy();

    // Mario must bounce with negative vertical velocity
    expect(mario.vy).toBe(MARIO_CONFIG.BOUNCE_FORCE);
    expect(mario.score).toBe(initialScore + SCORES.GOOMBA_STOMP);
  });
});

describe('Integration Test: Side Impact by Enemy (Damage and Life Loss)', () => {
  let map;
  let physics;
  let mario;
  let goomba;

  beforeEach(() => {
    map = new TileMap(16, 20, 15);
    for (let c = 0; c < 20; c++) {
      map.setTile(c, 10, TILES.GROUND);
    }
    physics = new PhysicsEngine(map, 980);

    // Mario on ground
    mario = new Mario(80, 144);
    mario.isGrounded = true;

    // Goomba collides from horizontal side with vy = 0
    goomba = new Goomba(85, 144);
    goomba.isGrounded = true;
  });

  it('reduces Mario life and triggers invulnerability state', () => {
    const initialLives = mario.lives;
    const entities = [mario, goomba];

    physics.resolveEntityToEntity(mario, entities);

    expect(mario.lives).toBe(initialLives - 1);
    expect(mario.invulnerableTimer).toBeGreaterThan(0);
    // Goomba should remain alive and not squashed
    expect(goomba.isAlive).toBeTruthy();
    expect(goomba.isSquashed).toBeFalsy();
  });
});

describe('Integration Test: Camera Tracking and Forward-Only Scroll Lock', () => {
  let camera;

  beforeEach(() => {
    camera = new Camera(256, 240);
  });

  it('tracks Mario when advancing beyond the lead threshold', () => {
    camera.update(50);
    expect(camera.x).toBe(0);

    // Advance Mario far to the right (x = 300)
    camera.update(300);
    expect(camera.x).toBeGreaterThan(0);
  });

  it('locks scroll position and prohibits backward scrolling (Classic NES Rule)', () => {
    camera.update(400);
    const lockedX = camera.x;

    // Mario moves backward to the left (x = 100)
    camera.update(100);
    expect(camera.x).toBe(lockedX);
  });
});

describe('Integration Test: Continuous Multi-Frame Step Simulation (Anti-Tunneling)', () => {
  let map;
  let physics;
  let mario;

  beforeEach(() => {
    map = new TileMap(16, 10, 10);
    // Ground at row 5 (y = 80)
    for (let c = 0; c < 10; c++) {
      map.setTile(c, 5, TILES.GROUND);
    }
    physics = new PhysicsEngine(map, 980);
    // Mario positioned at y = 20 falling at high speed
    mario = new Mario(16, 20);
    mario.vy = 400;
  });

  it('prevents tunneling through thin ground barriers across rapid frames', () => {
    for (let frame = 0; frame < 40; frame++) {
      physics.updateEntity(mario, 0.016);
    }

    // Mario must be stopped on top of ground (80 - 16 = 64) and not fall beneath row 5
    expect(mario.y).toBe(64);
    expect(mario.isGrounded).toBeTruthy();
  });
});

// Run standalone if executed directly via Node
if (typeof process !== 'undefined' && process.argv[1] && process.argv[1].endsWith('integration.test.js')) {
  runAll();
}