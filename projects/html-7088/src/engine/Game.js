import { InputHandler } from './InputHandler.js';
import { Camera } from './Camera.js';
import { AudioSystem } from './AudioSystem.js';
import { Level, TILE_SIZE } from '../world/Level.js';
import { Mario } from '../entities/Mario.js';
import { Goomba } from '../entities/Goomba.js';

'use strict';

export const GameState = {
    MENU: 0,
    PLAYING: 1,
    GAME_OVER: 2,
    VICTORY: 3
};

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: false });
        this.width = canvas.width;
        this.height = canvas.height;

        this.input = new InputHandler();
        this.audio = new AudioSystem();
        this.camera = new Camera(this.width, this.height);
        
        this.state = GameState.MENU;
        this.lastTime = performance.now();
        this.score = 0;
        this.coins = 0;
        this.lives = 3;
        this.timer = 400;
        this.timerAccumulator = 0;

        // UI references
        this.uiScore = document.getElementById('score-display');
        this.uiCoins = document.getElementById('coins-display');
        this.uiLives = document.getElementById('lives-display');
        this.uiTime = document.getElementById('time-display');
        this.overlay = document.getElementById('screen-overlay');
        this.overlayTitle = document.getElementById('overlay-title');
        this.overlaySubtitle = document.getElementById('overlay-subtitle');
        this.startBtn = document.getElementById('start-btn');

        this.level = null;
        this.mario = null;
        this.enemies = [];

        this._loopBound = this.loop.bind(this);
    }

    init() {
        this.startBtn.addEventListener('click', () => {
            this.audio.init();
            this.startGame();
        });

        // پشتیبانی از فشردن اینتر در کیبورد
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Enter' && (this.state === GameState.MENU || this.state === GameState.GAME_OVER || this.state === GameState.VICTORY)) {
                this.audio.init();
                this.startGame();
            }
        });

        requestAnimationFrame(this._loopBound);
    }

    startGame() {
        this.level = new Level();
        this.mario = new Mario(64, 300);
        this.mario.onHitQuestionBlock = () => {
            this.coins += 1;
            this.score += 200;
            this.updateHUD();
        };

        this.camera.reset();
        this.timer = 400;
        this.timerAccumulator = 0;
        this.state = GameState.PLAYING;
        this.overlay.classList.add('hidden');

        // تولید دشمنان با فاصله استاندارد
        this.enemies = [
            new Goomba(380, 380),
            new Goomba(650, 380),
            new Goomba(850, 380),
            new Goomba(1300, 380),
            new Goomba(1700, 380),
            new Goomba(2400, 380),
            new Goomba(3000, 380)
        ];

        this.updateHUD();
    }

    updateHUD() {
        if (this.uiScore) this.uiScore.textContent = String(this.score).padStart(6, '0');
        if (this.uiCoins) this.uiCoins.textContent = `x${String(this.coins).padStart(2, '0')}`;
        if (this.uiLives) this.uiLives.textContent = `x${this.lives}`;
        if (this.uiTime) this.uiTime.textContent = String(Math.floor(this.timer)).padStart(3, '0');
    }

    loop(currentTime) {
        // محاسبه امن دلتا-تایم و جلوگیری از پرش‌های غیرعادی (Time Delta Clamping)
        let dt = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        if (Number.isNaN(dt) || dt > 0.1) {
            dt = 0.016; // محافظت در صورت توقف تب
        }

        this.update(dt);
        this.render();

        requestAnimationFrame(this._loopBound);
    }

    update(dt) {
        if (this.state !== GameState.PLAYING) return;

        // شمارش معکوس زمان
        this.timerAccumulator += dt;
        if (this.timerAccumulator >= 1.0) {
            this.timerAccumulator -= 1.0;
            this.timer = Math.max(0, this.timer - 1);
            this.updateHUD();

            if (this.timer === 0 && !this.mario.isDead) {
                this.mario.die(this.audio);
            }
        }

        // بروزرسانی ماریو
        this.mario.update(dt, this.input, this.level, this.audio);

        // وضعیت مرگ ماریو
        if (this.mario.isDead) {
            if (this.mario.deathTimer > 2.5) {
                this.lives -= 1;
                this.updateHUD();
                if (this.lives <= 0) {
                    this.showGameOver();
                } else {
                    // ریست موقعیت مرحله با حفظ جان باقی‌مانده
                    this.mario = new Mario(64, 300);
                    this.camera.reset();
                    this.timer = 400;
                }
            }
            return;
        }

        // بروزرسانی موقعیت دوربین
        this.camera.update(this.mario.x, this.level.width * TILE_SIZE);

        // بروزرسانی و پردازش برخورد دشمنان
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(dt, this.level, this.camera.x);

            if (enemy.toRemove) {
                this.enemies.splice(i, 1);
                continue;
            }

            // چک کردن تلاقی با ماریو
            if (enemy.isAlive && this.mario.intersects(enemy)) {
                // اگر ماریو در حال فرود روی سر دشمن باشد
                const marioBottom = this.mario.y + this.mario.height;
                const enemyMidY = enemy.y + (enemy.height * 0.4);

                if (this.mario.vy > 0 && marioBottom <= enemyMidY + 12) {
                    enemy.squish(this.audio);
                    this.mario.vy = -320; // جهش برگشتی ماریو
                    this.score += 100;
                    this.updateHUD();
                } else {
                    this.mario.die(this.audio);
                }
            }
        }

        // پیروزی و رسیدن به پرچم
        if (this.mario.x >= this.level.flagX - 10) {
            this.showVictory();
        }
    }

    showGameOver() {
        this.state = GameState.GAME_OVER;
        this.overlayTitle.textContent = 'GAME OVER';
        this.overlayTitle.style.color = '#ef4444';
        this.overlaySubtitle.textContent = `امتیاز نهایی: ${this.score}`;
        this.startBtn.textContent = 'شروع مجدد';
        this.overlay.classList.remove('hidden');
        this.lives = 3;
        this.score = 0;
        this.coins = 0;
    }

    showVictory() {
        this.state = GameState.VICTORY;
        this.overlayTitle.textContent = 'VICTORY!';
        this.overlayTitle.style.color = '#22c55e';
        this.overlaySubtitle.textContent = `مرحله با موفقیت فتح شد! امتیاز: ${this.score + (this.timer * 50)}`;
        this.startBtn.textContent = 'بازی دوباره';
        this.overlay.classList.remove('hidden');
    }

    render() {
        // پس‌زمینه آسمان
        this.ctx.fillStyle = '#5c94fc';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // رندر ابرها و تپه‌های استاتیک دورنما (Parallax Visuals)
        this.renderScenery();

        // رندر نقشه مرحله
        if (this.level) {
            this.level.render(this.ctx, this.camera.x, this.width);
        }

        // رندر دشمنان
        for (const enemy of this.enemies) {
            enemy.render(this.ctx, this.camera.x);
        }

        // رندر ماریو
        if (this.mario) {
            this.mario.render(this.ctx, this.camera.x);
        }
    }

    renderScenery() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        // ابرها با سرعت حرکتی نرم‌تر از دوربین
        const bgOffset = this.camera.x * 0.2;
        for (let i = 0; i < 10; i++) {
            const cx = (i * 350) - bgOffset;
            if (cx > -100 && cx < this.width + 100) {
                this.ctx.beginPath();
                this.ctx.arc(cx, 80, 24, 0, Math.PI * 2);
                this.ctx.arc(cx + 20, 70, 28, 0, Math.PI * 2);
                this.ctx.arc(cx + 45, 80, 22, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
    }
}