/**
 * مدیریت ورودی‌های صفحه‌کلید همراه با پیشگیری از گیر کردن کلیدها (Key Sticky State Bug)
 */
'use strict';

export class InputHandler {
    constructor() {
        this.keys = {
            left: false,
            right: false,
            up: false,
            down: false,
            run: false,
            jump: false,
            enter: false
        };

        this._onKeyDown = this.handleKeyDown.bind(this);
        this._onKeyUp = this.handleKeyUp.bind(this);
        this._onBlur = this.resetKeys.bind(this);

        this.attach();
    }

    attach() {
        window.addEventListener('keydown', this._onKeyDown);
        window.addEventListener('keyup', this._onKeyUp);
        window.addEventListener('blur', this._onBlur);
    }

    detach() {
        window.removeEventListener('keydown', this._onKeyDown);
        window.removeEventListener('keyup', this._onKeyUp);
        window.removeEventListener('blur', this._onBlur);
    }

    handleKeyDown(e) {
        // ممانعت از اسکرول غیرارادی پنجره با کلیدهای Space و Arrow Keys
        if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
            e.preventDefault();
        }

        switch (e.code) {
            case 'ArrowLeft':
            case 'KeyA':
                this.keys.left = true;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.keys.right = true;
                break;
            case 'ArrowUp':
            case 'KeyW':
            case 'Space':
                this.keys.up = true;
                this.keys.jump = true;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.keys.down = true;
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
                this.keys.run = true;
                break;
            case 'Enter':
                this.keys.enter = true;
                break;
        }
    }

    handleKeyUp(e) {
        switch (e.code) {
            case 'ArrowLeft':
            case 'KeyA':
                this.keys.left = false;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.keys.right = false;
                break;
            case 'ArrowUp':
            case 'KeyW':
            case 'Space':
                this.keys.up = false;
                this.keys.jump = false;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.keys.down = false;
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
                this.keys.run = false;
                break;
            case 'Enter':
                this.keys.enter = false;
                break;
        }
    }

    resetKeys() {
        for (const key in this.keys) {
            if (Object.prototype.hasOwnProperty.call(this.keys, key)) {
                this.keys[key] = false;
            }
        }
    }
}