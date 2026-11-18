/**
 * استودیو B2.st - مدیریت رویدادهای ورودی کیبورد
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

        this.keyPressEvents = new Set();
        this._bindEvents();
    }

    _bindEvents() {
        window.addEventListener('keydown', (e) => {
            switch (e.code) {
                case 'ArrowLeft':
                case 'KeyA':
                    this.keys.left = true;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.keys.right = true;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.keys.down = true;
                    break;
                case 'Space':
                case 'KeyZ':
                case 'ArrowUp':
                case 'KeyW':
                    if (!this.keys.jump) this.keyPressEvents.add('jump');
                    this.keys.jump = true;
                    break;
                case 'ShiftLeft':
                case 'ShiftRight':
                case 'KeyX':
                    this.keys.run = true;
                    break;
            }
        });

        window.addEventListener('keyup', (e) => {
            switch (e.code) {
                case 'ArrowLeft':
                case 'KeyA':
                    this.keys.left = false;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.keys.right = false;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.keys.down = false;
                    break;
                case 'Space':
                case 'KeyZ':
                case 'ArrowUp':
                case 'KeyW':
                    this.keys.jump = false;
                    break;
                case 'ShiftLeft':
                case 'ShiftRight':
                case 'KeyX':
                    this.keys.run = false;
                    break;
            }
        });
    }

    isPressed(action) {
        const val = this.keyPressEvents.has(action);
        this.keyPressEvents.delete(action);
        return val;
    }
}