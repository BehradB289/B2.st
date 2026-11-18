/**
 * Universal Game Input Handler
 * Supports Keyboard, Gamepads (Standard API), and Virtual Mobile Touch D-Pad.
 */

export class InputManager {
  constructor() {
    this.keys = new Map();
    this.previousKeys = new Map();
    this.touchState = {
      left: false,
      right: false,
      down: false,
      jump: false,
      sprint: false
    };

    this._bindKeyboard();
  }

  _bindKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
      this.keys.set(e.code, true);
    });

    window.addEventListener('keyup', (e) => {
      this.keys.set(e.code, false);
    });
  }

  update() {
    // Copy current state to previous keys for edge detection
    this.previousKeys = new Map(this.keys);

    // Poll Gamepad if supported
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = gamepads[0];
    if (gp) {
      const dpadLeft = gp.axes[0] < -0.4 || gp.buttons[14]?.pressed;
      const dpadRight = gp.axes[0] > 0.4 || gp.buttons[15]?.pressed;
      const dpadDown = gp.axes[1] > 0.4 || gp.buttons[13]?.pressed;
      const btnA = gp.buttons[0]?.pressed || gp.buttons[1]?.pressed; // Jump
      const btnB = gp.buttons[2]?.pressed || gp.buttons[3]?.pressed; // Run/Fire

      if (dpadLeft) this.keys.set('ArrowLeft', true);
      if (dpadRight) this.keys.set('ArrowRight', true);
      if (dpadDown) this.keys.set('ArrowDown', true);
      if (btnA) this.keys.set('Space', true);
      if (btnB) this.keys.set('ShiftLeft', true);
    }
  }

  isDown(code) {
    return !!this.keys.get(code);
  }

  isJustPressed(code) {
    return !!this.keys.get(code) && !this.previousKeys.get(code);
  }

  // High-level action getters combining Keyboard and Touch
  get isLeft() {
    return this.isDown('ArrowLeft') || this.isDown('KeyA') || this.touchState.left;
  }

  get isRight() {
    return this.isDown('ArrowRight') || this.isDown('KeyD') || this.touchState.right;
  }

  get isDownAction() {
    return this.isDown('ArrowDown') || this.isDown('KeyS') || this.touchState.down;
  }

  get isJump() {
    return (
      this.isDown('Space') ||
      this.isDown('ArrowUp') ||
      this.isDown('KeyW') ||
      this.touchState.jump
    );
  }

  get isJumpJustPressed() {
    return (
      this.isJustPressed('Space') ||
      this.isJustPressed('ArrowUp') ||
      this.isJustPressed('KeyW') ||
      this.touchState.jumpJustPressed
    );
  }

  get isRunOrShoot() {
    return (
      this.isDown('ShiftLeft') ||
      this.isDown('ShiftRight') ||
      this.isDown('KeyX') ||
      this.touchState.sprint
    );
  }

  get isShootJustPressed() {
    return (
      this.isJustPressed('ShiftLeft') ||
      this.isJustPressed('ShiftRight') ||
      this.isJustPressed('KeyX') ||
      this.touchState.shootJustPressed
    );
  }
}