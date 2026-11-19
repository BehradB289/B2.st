/**
 * B2.st Studio - Mario Game Engine
 * Unit Tests: Database Layer, Schema Validation & Cryptographic Anti-Tamper
 * @module tests/database.test
 */

import { DatabaseLayer, DataIntegrityGuard } from '../src/db/database_layer.js';
import { SchemaValidator } from '../src/db/schema.js';

describe('B2.st Database Layer & Integrity Pipeline', () => {
  let db;

  beforeAll(async () => {
    db = new DatabaseLayer();
    await db.init();
  });

  test('SchemaValidator: should reject invalid save state payloads', () => {
    const invalidState = {
      slotId: '',
      world: 9, // Invalid world (1-8 allowed)
      level: 0,
      score: -50,
      coins: 150,
      lives: -1
    };
    const result = SchemaValidator.validateSaveState(invalidState);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(4);
  });

  test('SchemaValidator: should approve compliant state payload', () => {
    const validState = {
      slotId: 'slot_valid',
      world: 1,
      level: 1,
      score: 1200,
      coins: 15,
      lives: 3,
      timeRemaining: 340,
      mario: {
        x: 100,
        y: 190,
        velX: 0,
        velY: 0,
        powerState: 'SMALL'
      }
    };
    const result = SchemaValidator.validateSaveState(validState);
    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  test('DataIntegrityGuard: computeHash and verify untampered record', async () => {
    const payload = { id: 'test_item', score: 5000, user: 'P1' };
    const signed = await DataIntegrityGuard.sign(payload);

    expect(signed._signature).toBeDefined();
    expect(typeof signed._signature).toBe('string');

    const isValid = await DataIntegrityGuard.verify(signed);
    expect(isValid).toBe(true);
  });

  test('DataIntegrityGuard: detect modified/tampered record values', async () => {
    const payload = { id: 'test_item_tamper', score: 5000 };
    const signed = await DataIntegrityGuard.sign(payload);

    // Malicious edit
    signed.score = 9999999;

    const isValid = await DataIntegrityGuard.verify(signed);
    expect(isValid).toBe(false);
  });

  test('DatabaseLayer: saveGameState and loadGameState round-trip', async () => {
    const state = {
      slotId: 'slot_test_save',
      world: 2,
      level: 1,
      score: 4500,
      coins: 20,
      lives: 2,
      timeRemaining: 280,
      mario: {
        x: 240,
        y: 192,
        velX: 0,
        velY: 0,
        powerState: 'SUPER'
      }
    };

    await db.saveGameState(state);
    const loaded = await db.loadGameState('slot_test_save');

    expect(loaded).toBeDefined();
    expect(loaded.score).toBe(4500);
    expect(loaded.mario.powerState).toBe('SUPER');
  });

  test('DatabaseLayer: listSaveSlots correctly formats list', async () => {
    const slots = await db.listSaveSlots();
    expect(Array.isArray(slots)).toBe(true);
    const found = slots.find(s => s.slotId === 'slot_test_save');
    expect(found).toBeDefined();
    expect(found.world).toBe(2);
  });

  test('DatabaseLayer: High score descending retrieval', async () => {
    await db.recordHighScore({ playerName: 'ALICE', score: 1000, stage: '1-1' });
    await db.recordHighScore({ playerName: 'BOB', score: 9000, stage: '1-2' });
    await db.recordHighScore({ playerName: 'CHARLIE', score: 5000, stage: '1-1' });

    const top = await db.getTopHighScores(3);
    expect(top.length).toBeLessThanOrEqual(3);
    expect(top[0].score).toBeGreaterThanOrEqual(top[1]?.score || 0);
  });
});