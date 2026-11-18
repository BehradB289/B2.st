/**
 * استودیو B2.st - مدیر ارشد اجرای بازی (Game Orchestrator)
 * چرخه بازی (Game Loop)، همگام‌سازی انتیتی‌ها و رندرینگ Canvas
 */
import { Camera } from './engine/Camera.js';
import { InputHandler } from './engine/InputHandler.js';
import { RetroAudio } from './engine/Audio.js';
import { Mario } from './entities/Mario.js';
import { Level1 } from './levels/Level1.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;

        this.audio = new RetroAudio();
        this.input = new InputHandler();
        this.camera = new Camera(256, 240);

        this.level = new Level1();
        this.mario = new Mario(40, 160, this.audio);

        this.lastTime = 0;
        this.timeRemaining = 400;
        this.timerAccumulator = 0;
        this.isGameOver = false;

        // دکمه مخفی تغییر حالت به Super Mario جهت تست تعاملی (کلید P)
        window.addEventListener('keydown', (e) => {
            if (e.code === 'KeyP') {
                this.mario.upgradeToSuper();
            }
        });
    }

    start() {
        this.lastTime = performance.now();
        requestAnimationFrame(this.loop.bind(this));
    }

    loop(currentTime) {
        const dt = Math.min((currentTime - this.lastTime) / 1000, 0.05); // تثبیت فریم‌ریت (Delta clamp)
        this.lastTime = currentTime;

        this.update(dt);
        this.render();

        requestAnimationFrame(this.loop.bind(this));
    }

    update(dt) {
        // تایمر شمارش معکوس جهان NES
        this.timerAccumulator += dt;
        if (this.timerAccumulator >= 0.7 && !this.isGameOver) {
            this.timerAccumulator = 0;
            this.timeRemaining--;
            if (this.timeRemaining <= 0) {
                this.mario.kill();
                this.isGameOver = true;
            }
        }

        // پردازش ورودی و بروزرسانی وضعیت ماریو
        this.mario.handleInput(this.input, dt);
        this.mario.update(dt, this.level);
        this.mario.checkEnemyCollisions(this.level.enemies);

        // بروزرسانی تمام دشمنان فعال
        for (const enemy of this.level.enemies) {
            enemy.update(dt, this.level);
        }

        // حذف دشمنان از بین رفته از حافظه
        this.level.enemies = this.level.enemies.filter(e => !e.isRemoved);

        // همگام‌سازی دوربین با ماریو
        this.camera.update(this.mario);
    }

    render() {
        // پس‌زمینه آبی آسمانی NES
        this.ctx.fillStyle = '#6B8CFF';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // رندر دنیای بازی با ماتریس دوربین
        this.camera.apply(this.ctx);

        // رندر کاشی‌ها
        this.level.tileMap.render(this.ctx, this.camera);

        // رندر دشمنان
        for (const enemy of this.level.enemies) {
            enemy.render(this.ctx);
        }

        // رندر ماریو
        this.mario.render(this.ctx);

        this.camera.restore(this.ctx);

        // رندر HUD بالای صفحه
        this.renderHUD();
    }

    renderHUD() {
        this.ctx.save();
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '8px "Press Start 2P", monospace, sans-serif';
        this.ctx.textBaseline = 'top';

        // MARIO SCORE
        this.ctx.fillText('MARIO', 16, 8);
        this.ctx.fillText(String(this.mario.score).padStart(6, '0'), 16, 18);

        // COINS
        this.ctx.fillText(`$x${String(this.mario.coins).padStart(2, '0')}`, 90, 18);

        // WORLD
        this.ctx.fillText('WORLD', 140, 8);
        this.ctx.fillText('1-1', 148, 18);

        // TIME
        this.ctx.fillText('TIME', 205, 8);
        this.ctx.fillText(String(Math.max(0, this.timeRemaining)).padStart(3, '0'), 212, 18);

        this.ctx.restore();
    }
}