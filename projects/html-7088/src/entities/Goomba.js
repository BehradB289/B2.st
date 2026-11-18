/**
 * @file Goomba.js
 * @description Standard walking opponent with collision responses.
 */

"use strict";

export class Goomba {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 24;
        this.height = 24;
        this.vx = -1.2;
        this.vy = 0;
        this.onGround = false;
        this.isDead = false;
        this.deadTimer = 0;
    }

    update() {
        if (this.isDead) {
            this.deadTimer++;
            return;
        }
    }

    stomp() {
        this.isDead = true;
        this.vx = 0;
        this.vy = 0;
        this.height = 8;
        this.y += 16;
    }

    render(ctx, cameraX) {
        const renderX = Math.floor(this.x - cameraX);
        const renderY = Math.floor(this.y);

        if (renderX + this.width < 0 || renderX > ctx.canvas.width) return;

        if (this.isDead) {
            // Squished Goomba
            ctx.fillStyle = "#944200";
            ctx.fillRect(renderX, renderY, this.width, this.height);
            return;
        }

        // Mushroom body
        ctx.fillStyle = "#ab4700";
        ctx.fillRect(renderX + 2, renderY, this.width - 4, this.height - 6);

        // Stem & Feet
        ctx.fillStyle = "#ffcca3";
        ctx.fillRect(renderX + 4, renderY + 12, this.width - 8, 6);

        // Black Shoes
        ctx.fillStyle = "#000000";
        ctx.fillRect(renderX, renderY + 18, 8, 6);
        ctx.fillRect(renderX + 16, renderY + 18, 8, 6);

        // Eyes
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(renderX + 4, renderY + 6, 4, 6);
        ctx.fillRect(renderX + 16, renderY + 6, 4, 6);
        ctx.fillStyle = "#000000";
        ctx.fillRect(renderX + 6, renderY + 8, 2, 4);
        ctx.fillRect(renderX + 16, renderY + 8, 2, 4);
    }
}