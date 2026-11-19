/**
 * @file InputHandler.js
 * @description مدیریت پایدار و امن کلیدهای فشرده‌شده بدون نشت حافظه
 */

export class InputHandler {
    constructor() {
        /** @type {Set<string>} */
        this.activeKeys = new Set();

        this.allowedKeys = new Set([
            'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
            'KeyA', 'KeyD', 'KeyW', 'KeyS',
            'Space'
        ]);

        this._bindEvents();
    }

    _bindEvents() {
        window.addEventListener('keydown', (event) => {
            if (this.allowedKeys.has(event.code)) {
                this.activeKeys.add(event.code);
                // ممانعت از اسکرول صفحه حین بازی
                if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
                    event.preventDefault();
                }
            }
        });

        window.addEventListener('keyup', (event) => {
            if (this.allowedKeys.has(event.code)) {
                this.activeKeys.delete(event.code);
            }
        });

        window.addEventListener('blur', () => {
            this.clear();
        });
    }

    /**
     * @param {string[]} codes 
     * @returns {boolean}
     */
    isPressed(...codes) {
        return codes.some(code => this.activeKeys.has(code));
    }

    clear() {
        this.activeKeys.clear();
    }
}