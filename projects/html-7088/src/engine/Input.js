/**
 * مدیریت ورودی‌های صفحه کلید و کنترل‌های لمسی
 */
export class Input {
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
    this.init();
  }

  init() {
    window.addEventListener('keydown', (e) => {
      this.handleKey(e.code, true);
    });

    window.addEventListener('keyup', (e) => {
      this.handleKey(e.code, false);
    });
  }

  handleKey(code, isDown) {
    switch (code) {
      case 'ArrowLeft':
      case 'KeyA':
        this.keys.left = isDown;
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.keys.right = isDown;
        break;
      case 'ArrowUp':
      case 'KeyW':
      case 'Space':
        if (isDown && !this.keys.jump) {
          this.jumpPressed = true;
        }
        this.keys.jump = isDown;
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.keys.down = isDown;
        break;
      case 'KeyZ':
      case 'KeyK':
        if (isDown && !this.keys.jump) {
          this.jumpPressed = true;
        }
        this.keys.jump = isDown;
        break;
      case 'KeyX':
      case 'KeyJ':
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.run = isDown;
        break;
    }
  }

  /**
   * بازنشانی تریگر جهش در هر فریم
   */
  resetJumpPressed() {
    this.jumpPressed = false;
  }
}