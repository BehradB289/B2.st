import { GameConfig } from '../config/game_config.js';
import { PerformanceCache, RateLimiter } from './core/performance_cache.js';
import { GameLoop } from './engine/GameLoop.js';
import { Camera } from './engine/Camera.js';
import { InputHandler } from './engine/InputHandler.js';
import { AudioEngine } from './engine/AudioEngine.js';
import { SpriteSheet } from './levels/SpriteSheet.js';
import { Physics } from './engine/Physics.js';
import { Mario } from './entities/Mario.js';
import { buildLevel1 } from './levels/Level1.js';

/**
 * هماهنگ‌کننده مرکزی و ارکستراتور بازی سوپر ماریو
 */
export class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;

        // مقداردهی سیستم شتاب‌دهنده و کش هوشمند
        this.cache = new PerformanceCache({
            defaultTTL: GameConfig.CACHE.DEFAULT_TTL_MS,
            maxEntries: GameConfig.CACHE.MAX_ENTRIES,
            pruneIntervalMs: GameConfig.CACHE.PRUNE_INTERVAL_MS
        });
        this.rateLimiter = new RateLimiter();

        // ابزارهای زیرساختی موتور بازی
        this.audio = new AudioEngine(this.rateLimiter);
        this.input = new InputHandler();
        this.camera = new Camera(GameConfig.CANVAS.WIDTH, GameConfig.CANVAS.HEIGHT);
        this.spriteSheet = new SpriteSheet(this.cache);

        // متغیرهای وضعیت بازی و HUD
        this.score = 0;
        this.coins = 0;
        this.timeLeft = 400;
        this.timeTimer = 0;
        this.isGameOver = false;
        this.isVictory = false;

        this.initLevel();

        // چرخه بازی با دقت بالا
        this.loop = new GameLoop(
            (dt) => this.update(dt),
            () => this.render(),
            GameConfig.CANVAS.FIXED_DELTA
        );
    }

    initLevel() {
        const { tileMap, enemies, pixelWidth, pixelHeight } = buildLevel1(this.spriteSheet);
        this.tileMap = tileMap;
        this.enemies = enemies;
        this.levelPixelWidth = pixelWidth;
        this.levelPixelHeight = pixelHeight;

        this.mario = new Mario(40, 160, this.spriteSheet, this.audio);
        this.camera.x = 0;
    }

    start() {
        this.loop.start();
    }

    update(dt) {
        if (this.isGameOver) return;

        // شمارشگر زمان بازی
        this.timeTimer += dt;
        if (this.timeTimer >= 1.0) {
            this.timeLeft = Math.max(0, this.timeLeft - 1);
            this.timeTimer = 0;
            if (this.timeLeft === 0 && !this.mario.isDead) {
                this.mario.die();
            }
        }

        // به‌روزرسانی فیزیک ماریو و حل برخوردها
        this.mario.update(dt, this.input);
        if (!this.mario.isDead) {
            Physics.resolveTileCollisions(this.mario, this.tileMap, dt);
        }

        // بررسی برخورد سر ماریو با زیر بلوک‌ها (جایزه و صدا)
        this.mario.onCollideVertical = (direction, col, row) => {
            if (direction === -1) {
                const tile = this.tileMap.getTile(col, row);
                if (tile && tile.type === 'question') {
                    tile.type = 'empty_block';
                    this.score += 200;
                    this.coins += 1;
                    this.audio.playCoin();
                } else if (tile && tile.type === 'brick') {
                    this.audio.playBump();
                }
            }
        };

        // به‌روزرسانی دشمنان
        for (const enemy of this.enemies) {
            if (enemy.isDead) continue;

            // فقط دشمنانی که در محدوده دید دوربین هستند به‌روز شوند (بهینه‌سازی مصرف CPU)
            if (enemy.position.x < this.camera.x + this.camera.width + 32) {
                enemy.update(dt);
                Physics.resolveTileCollisions(enemy, this.tileMap, dt);

                // بررسی برخورد ماریو و دشمن (AABB)
                if (!this.mario.isDead && !enemy.isSquished) {
                    if (Physics.checkAABB(this.mario, enemy)) {
                        // پرش روی سر دشمن
                        if (this.mario.velocity.y > 0 && this.mario.position.y + this.mario.size.y - enemy.position.y < 10) {
                            enemy.squish();
                            this.mario.bounce();
                            this.score += 100;
                            this.audio.playStomp();
                        } else if (this.mario.invulnerableTimer <= 0) {
                            this.mario.die();
                            setTimeout(() => {
                                this.isGameOver = true;
                            }, 3000);
                        }
                    }
                }
            }
        }

        // حذف دشمنان مرده از آرایه
        this.enemies = this.enemies.filter(e => !e.isDead || e.squishTimer <= GameConfig.GOOMBA.SQUISH_TIME);

        // بررسی افتادن در چاله
        if (this.mario.position.y > this.canvas.height && !this.mario.isDead) {
            this.mario.die();
            setTimeout(() => {
                this.isGameOver = true;
            }, 2500);
        }

        // پیروزی با رسیدن به انتهای مرحله
        if (this.mario.position.x > (198 * 16) && !this.isVictory) {
            this.isVictory = true;
        }

        // دنبال کردن بازیکن توسط دوربین
        this.camera.update(this.mario, this.levelPixelWidth);

        // بروزرسانی تلمتری عملکرد کش در کنسول به صورت هوشمند
        this.rateLimiter.throttle('telemetry_log', 10000, () => {
            console.info(`[B2.st Cache Stats] Hit Ratio: ${this.cache.getHitRatio().toFixed(2)}% | Size: ${this.cache.store.size}`);
        });
    }

    render() {
        // ۱. رنگ آسمان نوستالژیک کلاسیک NES
        this.ctx.fillStyle = '#5c94fc';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // ۲. رندر تایل‌های مرحله
        this.tileMap.render(this.ctx, this.camera);

        // ۳. رندر دشمنان
        for (const enemy of this.enemies) {
            if (enemy.position.x > this.camera.x - 32 && enemy.position.x < this.camera.x + this.camera.width + 32) {
                enemy.render(this.ctx, this.camera);
            }
        }

        // ۴. رندر ماریو
        this.mario.render(this.ctx, this.camera);

        // ۵. رندر رابط کاربری و HUD کلاسیک
        this.renderHUD();

        // ۶. نمایش پیام Game Over یا Victory
        if (this.isGameOver) {
            this.renderCenterMessage('GAME OVER');
        } else if (this.isVictory) {
            this.renderCenterMessage('WORLD CLEARED!');
        }
    }

    renderHUD() {
        this.ctx.save();
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '8px "Courier New", monospace';
        this.ctx.textAlign = 'left';

        // ردیف اطلاعات بازی
        this.ctx.fillText('MARIO', 16, 16);
        this.ctx.fillText(String(this.score).padStart(6, '0'), 16, 26);

        this.ctx.fillText(`COINS x${String(this.coins).padStart(2, '0')}`, 88, 26);

        this.ctx.fillText('WORLD', 152, 16);
        this.ctx.fillText(' 1-1', 152, 26);

        this.ctx.fillText('TIME', 208, 16);
        this.ctx.fillText(String(this.timeLeft).padStart(3, '0'), 212, 26);

        this.ctx.restore();
    }

    renderCenterMessage(text) {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        this.ctx.fillRect(0, 80, this.canvas.width, 40);

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px "Courier New", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(text, this.canvas.width / 2, 105);
        this.ctx.restore();
    }
}

// راه‌اندازی خودکار بازی پس از لود صفحه
window.addEventListener('DOMContentLoaded', () => {
    const game = new Game('gameCanvas');
    game.start();

    // هندل تعامل اولیه برای آغاز AudioContext
    window.addEventListener('keydown', () => {
        if (game.audio.ctx && game.audio.ctx.state === 'suspended') {
            game.audio.ctx.resume();
        }
    }, { once: true });
});