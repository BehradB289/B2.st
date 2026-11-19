/**
 * Game Configuration & Physics Constants
 * Studio: B2.st
 * Architecture: Modular OOP / ECS-Lite Canvas Engine
 */

export const GameConfig = {
    canvas: {
        width: 256,
        height: 240,
        scale: 3, // Render scaling factor for crisp retro display
        fps: 60,
        backgroundColor: '#5c94fc' // Classic Super Mario Sky Blue
    },
    physics: {
        gravity: 980,             // Pixels per second squared
        terminalVelocity: 420,    // Maximum downward speed
        friction: 0.88,           // Horizontal ground friction
        airFriction: 0.94,        // Horizontal air resistance
        collisionIterations: 4    // AABB micro-step iterations to eliminate tunneling
    },
    player: {
        walkSpeed: 110,
        runSpeed: 175,
        jumpForce: 330,
        jumpHoldGravityScale: 0.45, // Variable jump height on holding button
        bounceForce: 210,
        invulnerabilityTime: 2.0,   // Seconds after being hit
        hitbox: {
            small: { width: 12, height: 15 },
            super: { width: 14, height: 28 }
        }
    },
    tiles: {
        size: 16
    },
    cache: {
        spriteCacheMax: 256,
        spriteCacheTTL: 600000,     // 10 minutes
        spatialGridTTL: 50,         // 50ms dynamic spatial index
        generalTTL: 30000           // 30 seconds
    },
    rateLimits: {
        jumpRefillRate: 3.5,        // Max 3.5 jumps per second
        jumpBurst: 1.0,
        soundTriggerInterval: 45,   // Min ms between same-frequency SFX
        pauseToggleThrottle: 250    // Milliseconds debounce
    }
};