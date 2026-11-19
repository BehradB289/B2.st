/**
 * Studio B2.st - Mario Canvas Game Configuration
 * NES Specifications & Physical Constants
 */
export const GameConfig = Object.freeze({
  CANVAS: {
    INTERNAL_WIDTH: 256,
    INTERNAL_HEIGHT: 240,
    ASPECT_RATIO: 256 / 240,
    TARGET_FPS: 60,
    FIXED_DELTA_TIME: 1 / 60
  },
  WORLD: {
    TILE_SIZE: 16,
    GRAVITY: 980,
    TERMINAL_VELOCITY: 390,
    TIME_LIMIT: 400
  },
  MARIO: {
    WALK_ACCEL: 320,
    RUN_ACCEL: 490,
    MAX_WALK_SPEED: 105,
    MAX_RUN_SPEED: 165,
    FRICTION: 0.86,
    AIR_FRICTION: 0.94,
    JUMP_IMPULSE: -320,
    JUMP_SUSTAIN_ACCEL: -150,
    MAX_JUMP_HOLD_TIME: 0.28,
    BOUNCE_IMPULSE: -220,
    INVULNERABLE_DURATION: 2.0,
    SMALL_BOUNDS: { x: 2, y: 1, w: 12, h: 15 },
    SUPER_BOUNDS: { x: 2, y: 2, w: 12, h: 30 }
  },
  ENEMIES: {
    GOOMBA_SPEED: 35,
    KOOPA_SPEED: 42,
    SHELL_SPEED: 220
  },
  PALETTE: {
    SKY_BLUE: '#5c94fc',
    GROUND_BROWN: '#c84c0c',
    GROUND_ORANGE: '#fc9838',
    BRICK_BROWN: '#b83400',
    PIPE_DARK_GREEN: '#00a800',
    PIPE_LIGHT_GREEN: '#00e800',
    COIN_GOLD: '#fcd844',
    WHITE: '#ffffff',
    BLACK: '#000000',
    MARIO_RED: '#d82800',
    MARIO_OVERALL_BLUE: '#0000fc'
  },
  API: {
    BASE_URL: '/api/v1',
    TIMEOUT_MS: 5000
  }
});