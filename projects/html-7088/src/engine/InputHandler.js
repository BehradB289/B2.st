/**
 * Low-latency Keyboard & Touch Input Controller
 * Studio: B2.st
 * Integrated with RateLimiter to throttle action triggers and prevent key bouncing
 */

import { globalActionLimiter } from '../core/performance_cache.js';
import { GameConfig } from '../../config/game.config.js';

export class InputHandler {
    constructor() {
        this.keys = {
            left: false,
            right: false,
            up: false,
            down: false,
            jump: false,
            run: false,
            pause: false
        };

        this.jumpPressedLastFrame = false;
        this.pausePressedLastFrame = false;
        this.onPauseToggle = null;

        this._setupKeyboardListeners();
    }

    _setupKeyboardListeners() {
        window.addEventListener('keydown', (e) => {
            this._handleKey(e.code, true);

            // Throttle pause toggle with sliding-window limiter
            if (e.code === 'KeyP' || e.code === 'Escape') {
                if (globalActionLimiter.throttle('input_pause_toggle', GameConfig.rateLimits.pauseToggleThrottle)) {
                    if (this.onPauseToggle) this.onPauseToggle();
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            this._handleKey(e.code, false);
        });
    }

    _handleKey(code, isDown) {
        switch (code) {
            case 'ArrowLeft':
            case 'KeyA':
                this.keys.left = isDown;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.keys.right = isDown;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.keys.down = isDown;
                break;
            case 'ArrowUp':
            case 'KeyW':
                this.keys.up = isDown;
                break;
            case 'Space':
            case 'KeyZ':
                this.keys.jump = isDown;
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
            case 'KeyX':
                this.keys.run = isDown;
                break;
        }
    }

    /**
     * Check if jump key was struck on this exact frame (rising edge)
     * Throttled by Token Bucket Rate Limiter
     */
    isJumpTriggered() {
        const triggered = this.keys.jump && !this.jumpPressedLastFrame;
        this.jumpPressedLastFrame = this.keys.jump;

        if (triggered) {
            // Apply token bucket rate limit to jump events
            return globalActionLimiter.consume(
                'player_jump_action',
                GameConfig.rateLimits.jumpBurst,
                GameConfig.rateLimits.jumpRefillRate
            );
        }
        return false;
    }

    isJumpHeld() {
        return this.keys.jump;
    }

    reset() {
        for (const key in this.keys) {
            this.keys[key] = false;
        }
        this.jumpPressedLastFrame = false;
    }
}