/**
 * Studio B2.st - Unified Input Manager (Keyboard & Mobile Touch)
 */
export class InputManager {
  constructor() {
    this.keys = new Map();
    this.previousKeys = new Map();
    this.touchStates = {
      left: false,
      right: false,
      down: false,
      jump: false,
      run: false
    };

    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
  }

  init() {
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
  }

  destroy() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
  }

  update() {
    this.previousKeys = new Map(this.keys);
  }

  _onKeyDown(e) {
    // Prevent default scrolling on game control keys
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
    this.keys.set(e.code, true);
  }

  _onKeyUp(e) {
    this.keys.set(e.code, false);
  }

  setTouchButton(btn, state) {
    if (this.touchStates[btn] !== undefined) {
      this.touchStates[btn] = Boolean(state);
    }
  }

  get isLeft() {
    return Boolean(
      this.keys.get('ArrowLeft') ||
      this.keys.get('KeyA') ||
      this.touchStates.left
    );
  }

  get isRight() {
    return Boolean(
      this.keys.get('ArrowRight') ||
      this.keys.get('KeyD') ||
      this.touchStates.right
    );
  }

  get isDown() {
    return Boolean(
      this.keys.get('ArrowDown') ||
      this.keys.get('KeyS') ||
      this.touchStates.down
    );
  }

  get isJump() {
    return Boolean(
      this.keys.get('Space') ||
      this.keys.get('ArrowUp') ||
      this.keys.get('KeyX') ||
      this.keys.get('KeyW') ||
      this.touchStates.jump
    );
  }

  get isJumpJustPressed() {
    const current = this.isJump;
    const wasJump = Boolean(
      this.previousKeys.get('Space') ||
      this.previousKeys.get('ArrowUp') ||
      this.previousKeys.get('KeyX') ||
      this.previousKeys.get('KeyW')
    );
    return current && !wasJump;
  }

  get isRun() {
    return Boolean(
      this.keys.get('ShiftLeft') ||
      this.keys.get('ShiftRight') ||
      this.keys.get('KeyZ') ||
      this.touchStates.run
    );
  }

  get isPauseJustPressed() {
    const isP = Boolean(this.keys.get('KeyP') || this.keys.get('Escape'));
    const wasP = Boolean(this.previousKeys.get('KeyP') || this.previousKeys.get('Escape'));
    return isP && !wasP;
  }
}