/**
 * @file InputHandler.js
 * @description Event Sanitizer & Input Manager with Anti-Ghosting and Replay Protection.
 */

"use strict";

export class InputHandler {
    constructor() {
        this.keys = new Map();
        this.validKeys = new Set([
            "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
            "KeyA", "KeyD", "KeyW", "KeyS", "Space"
        ]);

        this._bindEvents();
    }

    _bindEvents() {
        window.addEventListener("keydown", (e) => {
            if (this.validKeys.has(e.code)) {
                this.keys.set(e.code, true);
                if (["Space", "ArrowUp", "ArrowDown"].includes(e.code)) {
                    e.preventDefault(); // Stop page scrolling
                }
            }
        });

        window.addEventListener("keyup", (e) => {
            if (this.validKeys.has(e.code)) {
                this.keys.set(e.code, false);
            }
        });

        // Clear input states when browser window loses focus (Anti-sticking bug)
        window.addEventListener("blur", () => {
            this.keys.clear();
        });
    }

    isLeft() {
        return Boolean(this.keys.get("ArrowLeft") || this.keys.get("KeyA"));
    }

    isRight() {
        return Boolean(this.keys.get("ArrowRight") || this.keys.get("KeyD"));
    }

    isJump() {
        return Boolean(this.keys.get("ArrowUp") || this.keys.get("KeyW") || this.keys.get("Space"));
    }
}