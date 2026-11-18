/**
 * مدیر ورودی چندگانه: کیبورد، تاچ اسکرین و گیم‌پد با بافر کردن کلیدها
 */
export class InputHandler {
  constructor() {
    this.keys = {};
    this.prevKeys = {};
    this.touchStates = {};

    this.KEY_MAP = {
      ArrowLeft: 'left',
      ArrowRight: 'right',
      ArrowUp: 'up',
      ArrowDown: 'down',
      KeyA: 'left',
      KeyD: 'right',
      KeyW: 'jump',
      KeyS: 'down',
      Space: 'jump',
      KeyZ: 'jump',
      KeyX: 'run',
      ShiftLeft: 'run',
      ShiftRight: 'run',
      Enter: 'start',
      Escape: 'pause',
      KeyC: 'crt',
      Digit1: 'slot1',
      Digit2: 'slot2',
      Digit3: 'slot3',
      Digit4: 'slot4'
    };

    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));

    this.bindTouchControls();
  }

  onKeyDown(e) {
    const action = this.KEY_MAP[e.code];
    if (action) {
      this.keys[action] = true;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
    }
  }

  onKeyUp(e) {
    const action = this.KEY_MAP[e.code];
    if (action) {
      this.keys[action] = false;
    }
  }

  update() {
    // کپی وضعیت برای تشخیص تک کلیک (Just Pressed)
    this.prevKeys = { ...this.keys, ...this.touchStates };
  }

  isDown(action) {
    return !!(this.keys[action] || this.touchStates[action]);
  }

  isJustPressed(action) {
    const isNow = !!(this.keys[action] || this.touchStates[action]);
    const wasPrev = !!this.prevKeys[action];
    return isNow && !wasPrev;
  }

  bindTouchControls() {
    const map = [
      { id: 'btn-left', action: 'left' },
      { id: 'btn-right', action: 'right' },
      { id: 'btn-down', action: 'down' },
      { id: 'btn-jump', action: 'jump' },
      { id: 'btn-run', action: 'run' }
    ];

    map.forEach(({ id, action }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const start = (e) => {
        e.preventDefault();
        this.touchStates[action] = true;
      };
      const end = (e) => {
        e.preventDefault();
        this.touchStates[action] = false;
      };
      el.addEventListener('touchstart', start, { passive: false });
      el.addEventListener('touchend', end, { passive: false });
      el.addEventListener('mousedown', start);
      el.addEventListener('mouseup', end);
    });
  }
}