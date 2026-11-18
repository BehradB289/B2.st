/**
 * Super Mario Engine Configuration
 * Studio: B2.st
 * Centralized configuration parameters for engine, physics, cache, and input.
 */

export const CONFIG = {
  CANVAS: {
    WIDTH: 384,
    HEIGHT: 240,
    SCALE: 3,
    FPS: 60,
    CLEAR_COLOR: '#5c94fc' // Classic NES Mario sky blue
  },
  PHYSICS: {
    GRAVITY: 980,             // Pixels per second squared
    MAX_FALL_SPEED: 420,      // Terminal velocity
    WALK_ACCEL: 360,
    RUN_ACCEL: 540,
    DECELERATION: 400,
    FRICTION: 0.85,
    MAX_WALK_SPEED: 140,
    MAX_RUN_SPEED: 220,
    JUMP_FORCE: 350,
    HIGH_JUMP_FORCE: 410,
    BOUNCE_FORCE: 240
  },
  TILE_SIZE: 16,
  CACHE: {
    MAX_SIZE: 300,
    DEFAULT_TTL: 30000,       // 30 seconds
    AUTO_PRUNE_INTERVAL: 10000 // 10 seconds
  },
  RATE_LIMITER: {
    AUDIO_BURST: 8,
    AUDIO_RATE_PER_SEC: 12,
    INPUT_REPEAT_MS: 30
  },
  KEYS: {
    LEFT: ['ArrowLeft', 'KeyA'],
    RIGHT: ['ArrowRight', 'KeyD'],
    UP: ['ArrowUp', 'KeyW'],
    DOWN: ['ArrowDown', 'KeyS'],
    JUMP: ['Space', 'KeyZ', 'ArrowUp', 'KeyW'],
    RUN: ['ShiftLeft', 'ShiftRight', 'KeyX']
  }
};