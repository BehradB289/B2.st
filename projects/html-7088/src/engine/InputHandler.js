/**
 * مدیریت کلیدهای صفحه‌کلید با پشتیبانی از سیستم ضدتداخل
 */
export class InputHandler {
    constructor() {
        this.keys = {
            left: false,
            right: false,
            jump: false,
            run: false,
            down: false
        };

        this._setupListeners();
    }

    _setupListeners() {
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
                case 'Space':
                case 'KeyW':
                case 'ArrowUp':
                    this.keys.jump = true;
                    e.preventDefault();
                    break;
                case 'ShiftLeft':
                case 'ShiftRight':
                case 'KeyJ':
                    this.keys.run = true;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.keys.down = true;
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
                case 'Space':
                case 'KeyW':
                case 'ArrowUp':
                    this.keys.jump = false;
                    break;
                case 'ShiftLeft':
                case 'ShiftRight':
                case 'KeyJ':
                    this.keys.run = false;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.keys.down = false;
                    break;
            }
        });
    }
}