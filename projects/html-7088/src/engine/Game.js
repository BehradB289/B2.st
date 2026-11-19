/**
 * @file Game.js
 * @description موتور مرکزی لوپ، هماهنگ‌ساز رویدادها، دوربین و رندر فریم
 */

import { Sanitizer } from '../security/Sanitizer.js';
import { InputHandler } from './InputHandler.js';
import { Level } from '../world/Level.js';
import { Mario } from '../entities/Mario.js';
import { Goomba } from '../entities/Goomba.js';

export class Game {
    /**
     * @param {HTMLCanvasElement} canvas 
     */
    constructor(canvas) {
        if (!canvas) {
            throw new Error('کانواس مقداردهی نشده است.');
        }

        this.canvas = canvas;
        /** @type {CanvasRenderingContext2D} */
        this.ctx = this.canvas.getContext('2d', { alpha: false });

        this.input = new InputHandler();
        this.level = new Level();
        this.mario = new Mario(60, 200);

        this.enemies = [
            new Goomba(320, 200),
            new Goomba(580, 200),
            new Goomba(850, 100),
            new Goomba(1200, 200)
        ];

        this.cameraX = 0;
        this.score = 0;
        this.coins = 0;
        this.lives = 3;

        this.lastTime = 0;
        this.isRunning = false;

        this.uiScore = document.getElementById('mario-score');
        this.uiCoins = document.getElementById('mario-coins');
        this.uiLives = document.getElementById('mario-lives');

        this._tick = this._tick.bind(this);
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        requestAnimationFrame(this._tick);
    }

    stop() {
        this.isRunning = false;
    }

    _tick(currentTime) {
        if (!this.isRunning) return;

        const rawDelta = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // ایمن‌سازی دلتاتایم جهت پایداری فریم‌ریت
        const dt = Sanitizer.clampDeltaTime(rawDelta, 0.05);

        this.update(dt);
        this.render();

        requestAnimationFrame(this._tick);
    }

    /**
     * @param {number} dt 
     */
    update(dt) {
        this.mario.update(dt, this.input, this.level);

        // دوربین پویا متمرکز بر حرکت ماریو به سمت راست
        const targetCamX = this.mario.x - (this.canvas.width * 0.35);
        if (targetCamX > this.cameraX) {
            this.cameraX = targetCamX;
        }

        // بروزرسانی انتیتی‌های دشمن و بررسی برخورد
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(dt, this.level);

            if (enemy.isDead && enemy.deadTimer > 0.4) {
                this.enemies.splice(i, 1);
                continue;
            }

            if (!enemy.isDead && this._checkAABB(this.mario, enemy)) {
                // اگر ماریو از بالا روی دشمن بپرد
                if (this.mario.vy > 0 && (this.mario.y + this.mario.height - enemy.y) < 16) {
                    enemy.stomp();
                    this.mario.vy = -260; // پرش ارتجاعی
                    this.score += 200;
                    this._updateUI();
                } else {
                    // برخورد ماریو با دشمن از جناحین
                    const hitAccepted = this.mario.takeHit();
                    if (hitAccepted) {
                        this.lives -= 1;
                        this._updateUI();
                        if (this.lives <= 0) {
                            this._handleGameOver();
                        }
                    }
                }
            }
        }

        // سقوط ماریو در چاله‌ها
        if (this.mario.y > this.canvas.height) {
            this.lives -= 1;
            this._updateUI();
            if (this.lives > 0) {
                this._respawnMario();
            } else {
                this._handleGameOver();
            }
        }
    }

    _checkAABB(boxA, boxB) {
        return (
            boxA.x < boxB.x + boxB.width &&
            boxA.x + boxA.width > boxB.x &&
            boxA.y < boxB.y + boxB.height &&
            boxA.y + boxA.height > boxB.y
        );
    }

    _respawnMario() {
        this.mario.x = Math.max(50, this.cameraX + 20);
        this.mario.y = 50;
        this.mario.vx = 0;
        this.mario.vy = 0;
        this.mario.takeHit(); // شکست‌ناپذیری موقت
    }

    _handleGameOver() {
        alert(`بازی تمام شد! امتیاز کسب‌شده: ${this.score}`);
        this.lives = 3;
        this.score = 0;
        this.cameraX = 0;
        this.mario = new Mario(60, 200);
        this.enemies = [
            new Goomba(320, 200),
            new Goomba(580, 200),
            new Goomba(850, 100),
            new Goomba(1200, 200)
        ];
        this._updateUI();
    }

    _updateUI() {
        if (this.uiScore) this.uiScore.textContent = `MARIO: ${String(this.score).padStart(6, '0')}`;
        if (this.uiCoins) this.uiCoins.textContent = `COINS: ${String(this.coins).padStart(2, '0')}`;
        if (this.uiLives) this.uiLives.textContent = `LIVES: ${this.lives}`;
    }

    render() {
        // ۱. پاکسازی صفحه با رنگ آسمان
        this.ctx.fillStyle = '#5c94fc';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // ۲. رسم سطح لول و بلاک‌ها
        this.level.render(this.ctx, this.cameraX);

        // ۳. رسم دشمنان
        for (const enemy of this.enemies) {
            enemy.render(this.ctx, this.cameraX);
        }

        // ۴. رسم ماریو
        this.mario.render(this.ctx, this.cameraX);
    }
}