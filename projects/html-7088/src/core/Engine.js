/**
 * @file Engine.js
 * @description Main Loop Driver with delta-time anti-spiral protection and entity orchestrator.
 */

"use strict";

import { Mario } from "../entities/Mario.js";
import { Goomba } from "../entities/Goomba.js";
import { TileMap } from "../world/TileMap.js";
import { Physics } from "../physics/Physics.js";
import { InputHandler } from "./InputHandler.js";

export class Engine {
    constructor(canvas) {
        if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
            throw new Error("[B2.st Engine] Invalid Canvas Instance supplied.");
        }

        this.canvas = canvas;
        this.ctx = canvas.getContext("2d", { alpha: false });
        this.input = new InputHandler();
        this.map = new TileMap();
        this.mario = new Mario(100, 300);
        this.enemies = [
            new Goomba(350, 380),
            new Goomba(580, 380),
            new Goomba(850, 380)
        ];

        this.cameraX = 0;
        this.score = 0;
        this.coins = 0;
        this.lastTime = 0;
        this.isRunning = false;

        this._setupListeners();
    }

    _setupListeners() {
        window.addEventListener("coinCollected", (e) => {
            this.coins = e.detail.count;
            this.score += 200;
            const coinEl = document.getElementById("coins");
            const scoreEl = document.getElementById("score");
            if (coinEl) coinEl.innerText = `x${this.coins.toString().padStart(2, "0")}`;
            if (scoreEl) scoreEl.innerText = this.score.toString().padStart(6, "0");
        });
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        requestAnimationFrame(this._loop.bind(this));
    }

    _loop(timestamp) {
        if (!this.isRunning) return;

        // Anti-death spiral: delta time clamped to 100ms max
        const dt = Math.min(timestamp - this.lastTime, 100);
        this.lastTime = timestamp;

        this._update(dt);
        this._render();

        requestAnimationFrame(this._loop.bind(this));
    }

    _update() {
        // Player update & Physics
        this.mario.update(this.input);
        Physics.applyGravity(this.mario);
        Physics.resolveMapCollision(this.mario, this.map);

        // Enemies update
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update();

            if (!enemy.isDead) {
                Physics.applyGravity(enemy);
                Physics.resolveMapCollision(enemy, this.map);

                // Auto-turn on wall hit
                if (Math.abs(enemy.vx) < 0.1) {
                    enemy.vx *= -1;
                }

                // Check collision with Mario
                if (Physics.checkAABB(this.mario, enemy)) {
                    if (this.mario.vy > 0 && this.mario.y + this.mario.height - this.mario.vy <= enemy.y + 12) {
                        // Stomp enemy
                        enemy.stomp();
                        this.mario.vy = -7;
                        this.score += 100;
                        const scoreEl = document.getElementById("score");
                        if (scoreEl) scoreEl.innerText = this.score.toString().padStart(6, "0");
                    } else if (!this.mario.isDead) {
                        // Mario killed
                        this.mario.kill();
                    }
                }
            } else if (enemy.deadTimer > 40) {
                this.enemies.splice(i, 1);
            }
        }

        // Camera follow
        const targetCamX = this.mario.x - this.canvas.width / 3;
        if (targetCamX > this.cameraX) {
            this.cameraX = Math.floor(targetCamX);
        }
    }

    _render() {
        // Clear background with sky blue
        this.ctx.fillStyle = "#5c94fc";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Render World Map
        this.map.render(this.ctx, this.cameraX);

        // Render Enemies
        for (const enemy of this.enemies) {
            enemy.render(this.ctx, this.cameraX);
        }

        // Render Mario
        this.mario.render(this.ctx, this.cameraX);
    }
}