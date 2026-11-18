/**
 * Game Configuration Constants - B2.st Studio
 */
export const GAME_CONFIG = {
  CANVAS: {
    WIDTH: 256,
    HEIGHT: 240,
    SCALE: 3,
    BACKGROUND_COLOR: '#5c94fc',
    PIXEL_PERFECT: true
  },
  TIMING: {
    FPS: 60,
    FIXED_DELTA: 1 / 60,
    MAX_FRAME_TIME: 0.1
  },
  PHYSICS: {
    GRAVITY: 980,
    MAX_FALL_SPEED: 420,
    WALK_SPEED: 110,
    RUN_SPEED: 180,
    ACCELERATION: 360,
    FRICTION: 340,
    JUMP_FORCE: -350,
    JUMP_HOLD_GRAVITY_MOD: 0.45,
    BOUNCE_FORCE: -260,
    TILE_SIZE: 16
  },
  MARIO: {
    INITIAL_LIVES: 3,
    INVULNERABILITY_TIME: 2.0,
    SIZE: {
      SMALL: { width: 14, height: 16 },
      SUPER: { width: 14, height: 30 }
    }
  },
  API: {
    BASE_URL: 'http://localhost:3000/api/v1',
    DOCS_PATH: '/docs/openapi.json',
    STORAGE_KEY: 'b2st_mario_highscores'
  }
};