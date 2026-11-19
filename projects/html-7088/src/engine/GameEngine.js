/**
 * B2.st Studio - Main Game Engine Core
 * حلقه اصلی بازی با نرخ فریم کنترل شده و سیستم رندر بهینه
 */
"use strict";

import { Guardian } from "../security/Guardian.js";
import { InputHandler } from "./InputHandler.js";
import { Level } from "../world/Level.js";
import { Mario } from "../entities/Mario.js";

export class GameEngine {
    constructor(canvasId) {
        Guardian.init();

        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`[B2.st Critical] Canvas element '${canvasId}' could not be located in DOM.`);
        }

        this.ctx = this.canvas.getContext("2d", { alpha: false });
        this.input = new InputHandler();
        this.level = new Level();
        this.mario = new Mario(64, 300);

        this.cameraX = 0;
        this.lastTime = performance.now();
        this.isRunning = false;

        this._loop = this.loop.bind(this);
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        requestAnimationFrame(this._loop);
    }

    stop() {
        this.isRunning = false;
    }

    loop(currentTime) {
        if (!this.isRunning) return;

        // محاسبه ایمن دلتا تایم (Delta Time Safeguard)
        const dt = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        this.update(dt);
        this.render();

        requestAnimationFrame(this._loop);
    }

    update(dt) {
        this.mario.update(dt, this.input, this.level);

        // دوربین پویا متمرکز بر ماریو
        const targetCamX = this.mario.x - this.canvas.width / 3;
        const maxCamX = (this.level.cols * this.level.tileSize) - this.canvas.width;
        this.cameraX = Guardian.clamp(targetCamX, 0, maxCamX);
    }

    render() {
        // پس‌زمینه آسمان کلاسیک نینتندو
        this.ctx.fillStyle = "#6B8CFF";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // رندر لایه‌های نقشه و ماریو
        this.level.render(this.ctx, this.cameraX);
        this.mario.render(this.ctx, this.cameraX);

        // واسط کاربری (HUD)
        this.renderHUD();
    }

    renderHUD() {
        this.ctx.fillStyle = "#FFFFFF";
        this.ctx.font = "bold 14px monospace";
        this.ctx.fillText("MARIO (B2.st ENGINE)", 20, 24);
        this.ctx.fillText(`POS X: ${Math.floor(this.mario.x)}`, 20, 44);
        this.ctx.fillText("KEYS: [A/D] or [Arrows] Move | [W/Space] Jump", 20, this.canvas.height - 15);
    }
}