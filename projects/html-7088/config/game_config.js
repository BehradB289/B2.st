/**
 * Game Configuration Constants
 * Studio: B2.st
 */
export const GAME_CONFIG = {
    CANVAS: {
        INTERNAL_WIDTH: 256,
        INTERNAL_HEIGHT: 240,
        TARGET_FPS: 60,
        FIXED_DELTA: 1 / 60
    },
    PHYSICS: {
        GRAVITY: 980,            // px/s^2
        MAX_FALL_SPEED: 480,     // Terminal velocity
        FRICTION: 0.88,          // Ground friction coefficient
        AIR_RESISTANCE: 0.94     // Air resistance coefficient
    },
    MARIO: {
        WALK_ACCEL: 240,
        RUN_ACCEL: 420,
        MAX_WALK_SPEED: 120,
        MAX_RUN_SPEED: 190,
        JUMP_IMPULSE: -330,
        BOUNCE_IMPULSE: -220,
        SKID_THRESHOLD: 40
    },
    ENEMY: {
        GOOMBA_SPEED: 40,
        STOMP_DURATION: 0.5
    },
    WORLD: {
        TILE_SIZE: 16,
        CHUNK_WIDTH: 16,         // 16 tiles per chunk
        MAX_TIME: 400
    },
    CACHE: {
        DEFAULT_TTL_MS: 15000,   // 15 seconds
        MAX_CACHE_ENTRIES: 512,
        SPRITE_CACHE_TTL_MS: 60000,
        CHUNK_CACHE_TTL_MS: 30000
    },
    RATE_LIMITER: {
        INPUT_JUMP_CAPACITY: 3,
        INPUT_JUMP_REFILL: 4,    // Tokens per second
        AUDIO_TRIGGER_CAPACITY: 5,
        AUDIO_TRIGGER_REFILL: 10,
        PARTICLE_BURST_CAPACITY: 8,
        PARTICLE_BURST_REFILL: 12
    }
};