/**
 * Cross-platform Keyboard and Virtual Touch Input Handler
 */
export class InputHandler {
  constructor() {
    this.keys = new Map();
    this.prevKeys = new Map();

    this.bindings = {
      ArrowLeft: 'left',
      KeyA: 'left',
      ArrowRight: 'right',
      KeyD: 'right',
      ArrowUp: 'jump',
      KeyW: 'jump',
      Space: 'jump',
      ShiftLeft: 'run',
      KeyJ: 'run',
      KeyK: 'jump',
      KeyP: 'pause',
      KeyM: 'mute'
    };

    this.state = {
      left: false,
      right: false,
      jump: false,
      run: false,
      pause: false,
      mute: false
    };

    this.justPressed = {
      jump: false,
      pause: false,
      mute: false
    };

    this._bindEvents();
  }

  _bindEvents() {
    window.addEventListener('keydown', (e) => {
      const action = this.bindings[e.code];
      if (action) {
        if (!this.keys.get(action)) {
          this.justPressed[action] = true;
        }
        this.keys.set(action, true);
        if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
          e.preventDefault();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      const action = this.bindings[e.code];
      if (action) {
        this.keys.set(action, false);
      }
    });
  }

  update() {
    for (const action in this.state) {
      const isDown = !!this.keys.get(action);
      this.state[action] = isDown;
    }
  }

  postUpdate() {
    for (const key in this.justPressed) {
      this.justPressed[key] = false;
    }
  }

  setVirtualAction(action, isDown) {
    if (isDown && !this.keys.get(action)) {
      this.justPressed[action] = true;
    }
    this.keys.set(action, isDown);
  }
}