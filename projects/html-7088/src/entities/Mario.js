/**
 * @file Mario.js
 * @description Protagonist entity with standalone pixel graphics and safe vector math.
 */

"use strict";

import { Guardian } from "../security/Guardian.js";

export class Mario {
    constructor(x, y) {
        this.x = Guardian.sanitizeNumber(x, 0, 10000, 50);
        this.y = Guardian.sanitizeNumber(y, 0, 10000, 300);
        this.width = 24;
        this.height = 32;

        this.vx = 0;
        this.vy = 0;
        this.speed = 3.8;
        this.jumpForce = -13.5;
        this.onGround = false;
        this.facingRight = true;
        this.isDead = false;
    }

    update(inputHandler) {
        if (this.isDead) {
            this.y += 4;
            return;
        }

        this.vx = 0;
        if (inputHandler.isLeft()) {
            this.vx = -this.speed;
            this.facingRight = false;
        }
        if (inputHandler.isRight()) {
            this.vx = this.speed;
            this.facingRight = true;
        }

        if (inputHandler.isJump() && this.onGround) {
            this.vy = this.jumpForce;
            this.onGround = false;
        }

        // Kill Mario if falling into abyss
        if (this.y > 600) {
            this.kill();
        }
    }

    kill() {
        this.isDead = true;
        this.vx = 0;
        this.vy = -8;
    }

    render(ctx, cameraX) {
        const renderX = Math.floor(this.x - cameraX);
        const renderY = Math.floor(this.y);

        ctx.save();
        if (!this.facingRight) {
            ctx.translate(renderX + this.width, renderY);
            ctx.scale(-1, 1);
        } else {
            ctx.translate(renderX, renderY);
        }

        // Mario Standalone Pixel Art (Fallback-Free Native Rendering)
        // Cap & Shirt (Red)
        ctx.fillStyle = "#ff2500";
        ctx.fillRect(4, 0, 16, 6);
        ctx.fillRect(0, 14, 24, 10);

        // Face & Hands (Skin)
        ctx.fillStyle = "#ffcca3";
        ctx.fillRect(6, 6, 14, 8);
        ctx.fillRect(0, 20, 4, 6);
        ctx.fillRect(20, 20, 4, 6);

        // Dungarees (Blue)
        ctx.fillStyle = "#0027ff";
        ctx.fillRect(4, 20, 16, 8);

        // Shoes (Brown)
        ctx.fillStyle = "#6b3300";
        ctx.fillRect(2, 28, 8, 4);
        ctx.fillRect(14, 28, 8, 4);

        ctx.restore();
    }
}