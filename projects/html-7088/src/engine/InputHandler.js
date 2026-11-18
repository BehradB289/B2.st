/**
 * @file InputHandler.js
 * @description Keyboard state management integrated with Rate Limiter to prevent event floods.
 */
export class InputHandler {
  /**
   * @param {RateLimiter} rateLimiter
   */
  constructor(rateLimiter) {
    this.keys = new Set();
    this.rateLimiter = rateLimiter;

    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
      this.keys.add(e.code);
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });
  }

  isDown(code) {
    return this.keys.has(code);
  }

  /**
   * Check for triggered action with rate-limiting safeguard.
   */
  isActionTriggered(code, keyName, cooldownMs = 200) {
    if (!this.keys.has(code)) return false;
    return this.rateLimiter.throttle(keyName, cooldownMs);
  }

  get horizontalAxis() {
    let dir = 0;
    if (this.keys.has('ArrowRight') || this.keys.has('KeyD')) dir += 1;
    if (this.keys.has('ArrowLeft') || this.keys.has('KeyA')) dir -= 1;
    return dir;
  }

  get isJumping() {
    return this.keys.has('ArrowUp') || this.keys.has('KeyW') || this.keys.has('Space') || this.keys.has('KeyZ');
  }

  get isRunning() {
    return this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') || this.keys.has('KeyX');
  }
}