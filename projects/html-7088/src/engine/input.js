/**
 * Input Management with Touch, Keyboard, and RateLimiter Guard
 * Layer: Central Engine
 * Studio: B2.st
 */

import { CONFIG } from '../../config/game_config.js';
import { RateLimiter } from '../core/performance_cache.js';

export class InputHandler {
  constructor() {
    this.keys = {
      left: false,
      right: false,
      up: false,
      down: false,
      jump: false,
      run: false
    };

    this.jumpPressed = false;
    this.jumpRateLimiter = new RateLimiter(CONFIG.RATE_LIMITER.AUDIO_BURST, CONFIG.RATE_LIMITER.AUDIO_RATE_PER_SEC);

    this.initKeyboard();
  }

  initKeyboard() {
    window.addEventListener('keydown', (e) => {
      this.handleKey(e.code, true);
    });

    window.addEventListener('keyup', (e) => {
      this.handleKey(e.code, false);
    });
  }

  handleKey(code, isPressed) {
    if (CONFIG.KEYS.LEFT.includes(code)) {
      this.keys.left = isPressed;
    }
    if (CONFIG.KEYS.RIGHT.includes(code)) {
      this.keys.right = isPressed;
    }
    if (CONFIG.KEYS.UP.includes(code)) {
      this.keys.up = isPressed;
    }
    if (CONFIG.KEYS.DOWN.includes(code)) {
      this.keys.down = isPressed;
    }
    if (CONFIG.KEYS.JUMP.includes(code)) {
      if (isPressed && !this.keys.jump) {
        this.jumpPressed = true;
      }
      this.keys.jump = isPressed;
    }
    if (CONFIG.KEYS.RUN.includes(code)) {
      this.keys.run = isPressed;
    }
  }

  consumeJump() {
    if (this.jumpPressed) {
      this.jumpPressed = false;
      return true;
    }
    return false;
  }

  reset() {
    for (const key in this.keys) {
      this.keys[key] = false;
    }
    this.jumpPressed = false;
  }
}