/**
 * B2.st Studio - Robust Input Controller
 * سیستم دریافت ورودی با فیلتر امنیتی و جلوگیری از تداخل کلیدها
 */
"use strict";

export class InputHandler {
    constructor() {
        this.keys = new Set();
        this.validKeys = new Set([
            "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
            "KeyA", "KeyD", "KeyW", "KeyS", "Space"
        ]);

        this._onKeyDown = this.handleKeyDown.bind(this);
        this._onKeyUp = this.handleKeyUp.bind(this);

        this.bindEvents();
    }

    bindEvents() {
        window.addEventListener("keydown", this._onKeyDown);
        window.addEventListener("keyup", this._onKeyUp);
    }

    handleKeyDown(e) {
        if (this.validKeys.has(e.code)) {
            // جلوگیری از اسکرول صفحه هنگام استفاده از کلیدهای ناوبری
            e.preventDefault();
            this.keys.add(e.code);
        }
    }

    handleKeyUp(e) {
        if (this.validKeys.has(e.code)) {
            e.preventDefault();
            this.keys.delete(e.code);
        }
    }

    isPressed(keyIdentifier) {
        return this.keys.has(keyIdentifier);
    }

    isLeft() {
        return this.keys.has("ArrowLeft") || this.keys.has("KeyA");
    }

    isRight() {
        return this.keys.has("ArrowRight") || this.keys.has("KeyD");
    }

    isJump() {
        return this.keys.has("ArrowUp") || this.keys.has("KeyW") || this.keys.has("Space");
    }

    destroy() {
        window.removeEventListener("keydown", this._onKeyDown);
        window.removeEventListener("keyup", this._onKeyUp);
        this.keys.clear();
    }
}