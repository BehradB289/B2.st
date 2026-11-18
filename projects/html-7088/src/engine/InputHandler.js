/**
 * Keyboard and Simulated Input Manager
 * Studio: B2.st
 */

export class InputHandler {
  constructor() {
    this.keys = {
      left: false,
      right: false,
      down: false,
      jump: false,
      run: false
    };

    this.keyMap = {
      ArrowLeft: 'left',
      KeyA: 'left',
      ArrowRight: 'right',
      KeyD: 'right',
      ArrowDown: 'down',
      KeyS: 'down',
      ArrowUp: 'jump',
      KeyW: 'jump',
      Space: 'jump',
      KeyZ: 'jump',
      KeyX: 'run',
      ShiftLeft: 'run',
      ShiftRight: 'run'
    };
  }

  bindDOM(target = (typeof window !== 'undefined' ? window : null)) {
    if (!target || !target.addEventListener) return;

    target.addEventListener('keydown', (event) => {
      const action = this.keyMap[event.code];
      if (action) {
        this.keys[action] = true;
        if (event.code === 'Space' || event.code.startsWith('Arrow')) {
          event.preventDefault();
        }
      }
    });

    target.addEventListener('keyup', (event) => {
      const action = this.keyMap[event.code];
      if (action) {
        this.keys[action] = false;
        if (event.code === 'Space' || event.code.startsWith('Arrow')) {
          event.preventDefault();
        }
      }
    });
  }

  setKey(action, state) {
    if (this.keys.hasOwnProperty(action)) {
      this.keys[action] = Boolean(state);
    }
  }

  reset() {
    for (const key of Object.keys(this.keys)) {
      this.keys[key] = false;
    }
  }
}