import { describe, it, expect, beforeEach } from 'vitest';
import { PhysicsEngine } from '../src/engine/PhysicsEngine.js';
import { TileMap, TILE_TYPES } from '../src/levels/TileMap.js';
import { Mario } from '../src/entities/Mario.js';
import { Goomba } from '../src/entities/Goomba.js';
import { Coin } from '../src/entities/Coin.js';
import { AABB } from '../src/engine/AABB.js';

describe('Collision & Game Mechanics Suite', () => {
  let physics;
  let tileMap;
  let mario;

  beforeEach(() => {
    physics = new PhysicsEngine();
    tileMap = new TileMap(16);
    mario = new Mario(50, 50);
  });

  describe('AABB Geometry Overlap Tests', () => {
    it('detects intersecting bounding boxes correctly', () => {
      const boxA = new AABB(0, 0, 16, 16);
      const boxB = new AABB(10, 10, 16, 16);
      const boxC = new AABB(30, 30, 16, 16);

      expect(boxA.intersects(boxB)).toBe(true);
      expect(boxA.intersects(boxC)).toBe(false);
    });
  });

  describe('Tile Collision & Ground Stability', () => {
    it('resolves downward landing on solid ground and resets vertical velocity', () => {
      // Build ground at y = 100 (tiles at row 6, height 16 each)
      // Tile at (x: 48, y: 96)
      tileMap.setTile(3, 6, TILE_TYPES.GROUND); // 48px to 64px, y: 96 to 112px

      // Position Mario falling into the floor
      mario.pos.set(50, 92); // bottom at 92 + 16 = 108 (penetrates top surface by 12px)
      mario.vel.set(0, 300);
      mario.isGrounded = false;

      physics.resolveTileMapCollisions(mario, tileMap);

      // Should snap Mario's bottom exactly to tile.top (96px) => Mario pos.y = 80px
      expect(mario.pos.y).toBe(80);
      expect(mario.vel.y).toBe(0);
      expect(mario.isGrounded).toBe(true);
    });

    it('resolves ceiling hit by stopping upward velocity and repelling down', () => {
      tileMap.setTile(3, 2, TILE_TYPES.BRICK); // y: 32 to 48px

      mario.pos.set(50, 44); // top at 44 (penetrating tile bottom at 48)
      mario.vel.set(0, -350);

      physics.resolveTileMapCollisions(mario, tileMap);

      // Mario should be snapped below tile: y = 48
      expect(mario.pos.y).toBe(48);
      expect(mario.vel.y).toBe(0);
    });

    it('blocks horizontal penetration against solid walls', () => {
      tileMap.setTile(5, 5, TILE_TYPES.PIPE); // x: 80 to 96px, y: 80 to 96px

      mario.pos.set(70, 80); // right edge at 86 (penetrates 80 by 6px)
      mario.vel.set(120, 0);

      physics.resolveTileMapCollisions(mario, tileMap);

      // Mario should be pushed left to x: 64 (80 - 16)
      expect(mario.pos.x).toBe(64);
      expect(mario.vel.x).toBe(0);
    });
  });

  describe('Goomba Stomping & Elimination Mechanics', () => {
    it('squashes Goomba, bounces Mario, and adds 100 points when stomped from above', () => {
      const initialScore = mario.score;
      const goomba = new Goomba(50, 60); // top at 60

      // Position Mario falling onto Goomba's head
      mario.pos.set(50, 48); // Mario bottom at 64 (within upper threshold of Goomba)
      mario.vel.set(0, 200);  // Falling downwards

      const event = physics.resolveEntityInteraction(mario, goomba);

      expect(event).toBe('goomba_stomped');
      expect(goomba.isAlive).toBe(false);
      expect(goomba.type).toBe('goomba_squashed');
      // Mario bounces upward
      expect(mario.vel.y).toBeLessThan(0);
      // Score precisely increases by 100
      expect(mario.score).toBe(initialScore + 100);
    });

    it('damages Mario when colliding laterally with live Goomba', () => {
      const goomba = new Goomba(60, 50);

      mario.pos.set(50, 50); // Same height, lateral overlap
      mario.vel.set(50, 0);   // Moving sideways, not falling

      const initialLives = mario.lives;
      const event = physics.resolveEntityInteraction(mario, goomba);

      expect(event).toBe('mario_damaged');
      expect(mario.lives).toBe(initialLives - 1);
      expect(goomba.isAlive).toBe(true);
    });
  });

  describe('Collectible Rewards: Coin Pickup Mechanics', () => {
    it('collects coin upon overlap, increments coin count by 1 and score by 200', () => {
      const coin = new Coin(52, 52);
      mario.pos.set(50, 50);

      const initialCoins = mario.coins;
      const initialScore = mario.score;

      const event = physics.resolveEntityInteraction(mario, coin);

      expect(event).toBe('coin_collected');
      expect(coin.collected).toBe(true);
      expect(coin.isAlive).toBe(false);
      expect(mario.coins).toBe(initialCoins + 1);
      expect(mario.score).toBe(initialScore + 200);
    });

    it('accumulates multiple coins and converts 100 coins into an extra life', () => {
      mario.coins = 99;
      const initialLives = mario.lives;
      const coin = new Coin(50, 50);
      mario.pos.set(50, 50);

      physics.resolveEntityInteraction(mario, coin);

      expect(mario.coins).toBe(0); // Rolled over
      expect(mario.lives).toBe(initialLives + 1); // 1-UP rewarded
    });
  });
});