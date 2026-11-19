/**
 * Game Global Configuration & Physics Constants
 * B2.st Studio - Modular Engine Configuration
 */
export const GAME_CONFIG = {
  // Screen and Tile System
  TILE_SIZE: 16,
  VIEWPORT_WIDTH: 256,
  VIEWPORT_HEIGHT: 240,
  TARGET_FPS: 60,
  FIXED_DELTA_TIME: 1 / 60,

  // Kinematics & Physics Limits
  GRAVITY: 980,              // Pixels / sec^2
  TERMINAL_VELOCITY: 480,    // Max fall speed in pixels / sec
  WALK_ACCEL: 240,           // Pixels / sec^2
  MAX_WALK_SPEED: 120,       // Pixels / sec
  MAX_RUN_SPEED: 180,        // Pixels / sec
  FRICTION: 300,             // Ground horizontal friction

  // Jumping Dynamics
  JUMP_IMPULSE: -320,        // Initial upward velocity impulse
  BOUNCE_IMPULSE: -220,      // Vertical bounce after stomping enemy
  HEAD_BUMP_REBOUND: 40,     // Downward velocity when hitting ceiling/block

  // Mario States
  MARIO_STATE: {
    SMALL: 'SMALL',
    SUPER: 'SUPER',
    DEAD: 'DEAD'
  },

  // Tile Types
  TILE_TYPE: {
    AIR: 0,
    GROUND: 1,
    BRICK: 2,
    QUESTION_BLOCK: 3,
    EMPTY_BLOCK: 4,
    PIPE_TOP_LEFT: 5,
    PIPE_TOP_RIGHT: 6,
    PIPE_BODY_LEFT: 7,
    PIPE_BODY_RIGHT: 8
  },

  // Scoring
  SCORES: {
    STOMP_GOOMBA: 100,
    COIN: 200,
    BREAK_BRICK: 50
  }
};