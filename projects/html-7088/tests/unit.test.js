/**
 * Core Mathematics, AABB, and TileMap Unit Tests
 * Studio: B2.st
 */

import { describe, it, expect, runAll } from './testRunner.js';
import { Vector2D } from '../src/engine/Vector2D.js';
import { AABB } from '../src/engine/AABB.js';
import { TileMap } from '../src/levels/TileMap.js';
import { TILES } from '../config/constants.js';

describe('Vector2D Mathematical Component', () => {
  it('correctly sets coordinates and clones instances', () => {
    const v1 = new Vector2D(12, -4);
    const v2 = v1.clone();
    expect(v2.x).toBe(12);
    expect(v2.y).toBe(-4);
    expect(v1.equals(v2)).toBeTruthy();
  });

  it('performs vector addition and scalar multiplication', () => {
    const v1 = new Vector2D(10, 20);
    const v2 = new Vector2D(5, -10);
    const added = v1.add(v2);
    expect(added.x).toBe(15);
    expect(added.y).toBe(10);

    const scaled = added.multiply(2);
    expect(scaled.x).toBe(30);
    expect(scaled.y).toBe(20);
  });

  it('calculates vector magnitude correctly', () => {
    const v = new Vector2D(3, 4);
    expect(v.magnitude()).toBe(5);
  });
});

describe('AABB Bounding Box Collision Component', () => {
  it('correctly calculates perimeter boundary edges', () => {
    const box = new AABB(10, 20, 16, 32);
    expect(box.left).toBe(10);
    expect(box.right).toBe(26);
    expect(box.top).toBe(20);
    expect(box.bottom).toBe(52);
    expect(box.centerX).toBe(18);
    expect(box.centerY).toBe(36);
  });

  it('detects intersecting bounding boxes accurately', () => {
    const boxA = new AABB(0, 0, 16, 16);
    const boxB = new AABB(12, 12, 16, 16);
    const boxC = new AABB(30, 30, 16, 16);

    expect(boxA.intersects(boxB)).toBeTruthy();
    expect(boxB.intersects(boxA)).toBeTruthy();
    expect(boxA.intersects(boxC)).toBeFalsy();
  });

  it('detects point containment', () => {
    const box = new AABB(10, 10, 50, 50);
    expect(box.contains(25, 25)).toBeTruthy();
    expect(box.contains(5, 25)).toBeFalsy();
    expect(box.contains(70, 70)).toBeFalsy();
  });
});

describe('TileMap and Solid Block Inspection', () => {
  it('identifies solid vs empty tiles properly', () => {
    const map = new TileMap(16, 10, 10);
    map.setTile(2, 3, TILES.GROUND);
    map.setTile(4, 5, TILES.BRICK);
    map.setTile(1, 1, TILES.QUESTION_BLOCK);

    expect(map.isSolid(2, 3)).toBeTruthy();
    expect(map.isSolid(4, 5)).toBeTruthy();
    expect(map.isSolid(1, 1)).toBeTruthy();
    expect(map.isSolid(0, 0)).toBeFalsy();
  });

  it('returns empty tile for out-of-bounds coordinates', () => {
    const map = new TileMap(16, 5, 5);
    expect(map.getTile(-1, 0)).toBe(TILES.EMPTY);
    expect(map.getTile(10, 10)).toBe(TILES.EMPTY);
    expect(map.isSolid(-1, -1)).toBeFalsy();
  });
});

// Run standalone if executed directly via Node
if (typeof process !== 'undefined' && process.argv[1] && process.argv[1].endsWith('unit.test.js')) {
  runAll();
}