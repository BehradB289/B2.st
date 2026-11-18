/**
 * Super Mario Canvas Engine - Studio B2.st
 * Central Game Configuration & NES Constants
 */

export const CONFIG = {
  CANVAS: {
    INTERNAL_WIDTH: 256,
    INTERNAL_HEIGHT: 240,
    ASPECT_RATIO: 256 / 240,
    FPS: 60,
    FIXED_DELTA: 1 / 60
  },
  PHYSICS: {
    GRAVITY: 980,
    MAX_FALL_SPEED: 480,
    FRICTION: 0.88,
    AIR_RESISTANCE: 0.94
  },
  MARIO: {
    WALK_ACCEL: 320,
    RUN_ACCEL: 520,
    MAX_WALK_SPEED: 130,
    MAX_RUN_SPEED: 210,
    JUMP_IMPULSE: -360,
    HIGH_JUMP_HOLD_TIME: 0.28,
    BOUNCE_IMPULSE: -260,
    INVULNERABLE_TIME: 2.5,
    STAR_POWER_TIME: 12.0
  },
  TILES: {
    SIZE: 16,
    EMPTY: 0,
    GROUND: 1,
    BRICK: 2,
    QUESTION_COIN: 3,
    QUESTION_POWERUP: 4,
    HARD_BLOCK: 5,
    PIPE_TOP_LEFT: 6,
    PIPE_TOP_RIGHT: 7,
    PIPE_SHAFT_LEFT: 8,
    PIPE_SHAFT_RIGHT: 9,
    FLAG_POLE_TOP: 10,
    FLAG_POLE: 11,
    FLAG_BASE: 12,
    USED_BLOCK: 13
  },
  COLORS: {
    SKY_BLUE: '#5c94fc',
    UNDERGROUND_BG: '#000000',
    GROUND_BROWN: '#c84c0c',
    GROUND_BORDER: '#000000',
    BRICK_BROWN: '#b84418',
    QUESTION_GOLD: '#fc9838',
    MARIO_RED: '#f83800',
    MARIO_OVERALL: '#0020d8',
    MARIO_SKIN: '#ffa044',
    FIRE_WHITE: '#ffffff',
    STAR_PALETTES: [
      ['#f83800', '#0020d8', '#ffa044'],
      ['#00a800', '#f83800', '#ffffff'],
      ['#e45c10', '#000000', '#fce0a8'],
      ['#00e8d8', '#fc7460', '#ffffff']
    ]
  }
};