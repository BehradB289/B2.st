/**
 * Main Application Orchestrator & Game Bootstrap
 * Studio: B2.st
 */
import { GAME_CONFIG } from '../config/game_config.js';
import { PerformanceCache, RateLimiter } from '../src/core/performance_cache.js';
import { GameLoop } from '../src/engine/game_loop.js';
import { Camera } from '../src/engine/camera.js';
import { PhysicsEngine } from '../src/engine/physics.js';
import { InputHandler } from '../src/engine/input_handler.js';
import { RetroAudio } from '../src/audio/retro_audio.js';
import { LevelManager } from '../src/levels/level_manager.js';
import { Mario } from '../src/entities/mario.js';
import { Particle } from '../src/entities/collectible.js';

class MarioGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d', { alpha: false });

        // HUD Elements
        this.scoreElem = document.getElementById('score-val');
        this.coinsElem = document.getElementById('coins-val');
        this.timeElem = document.getElementById('time-val');
        this.fpsElem = document.getElementById('stat-fps');
        this.hitRateElem = document.getElementById('stat-hitrate');
        this.cacheSizeElem = document.getElementById('stat-cachesize');

        // Core Performance Caching Engine & Rate Limiter
        this.cache = new PerformanceCache({
            maxEntries: GAME_CONFIG.CACHE.MAX_CACHE_ENTRIES,
            defaultTTL: GAME_CONFIG.CACHE.DEFAULT_TTL_MS
        });

        this.rateLimiter = new RateLimiter(
            GAME_CONFIG.RATE_LIMITER.AUDIO_TRIGGER_CAPACITY,
            GAME_CONFIG.RATE_LIMITER.AUDIO_TRIGGER_REFILL
        );

        // Core Modules
        this.audio = new RetroAudio(this.rateLimiter);
        this.input = new InputHandler(this.rateLimiter);
        this.physics = new PhysicsEngine();
        this.camera = new Camera(GAME_CONFIG.CANVAS.INTERNAL_WIDTH, GAME_CONFIG.CANVAS.INTERNAL_HEIGHT);

        // State variables
        this.score = 0;
        this.coins = 0;
        this.timeRemaining = GAME_CONFIG.WORLD.MAX_TIME;
        this.particles = [];

        this._setupMobileTouch();
        this._initLevel();

        // Game Loop
        this.loop = new GameLoop(
            (dt) => this.update(dt),
            (alpha) => this.render(alpha)
        );

        this.loop.start();

        // Periodic Cache Eviction Routine
        setInterval(() => {
            this.cache.purgeExpired();
        }, 10000);
    }

    _initLevel() {
        this.level = new LevelManager(this.cache);
        this.camera.setBounds(this.level.mapWidth * GAME_CONFIG.WORLD.TILE_SIZE);
        this.mario = new Mario(32, 180, this.cache);
        this.particles = [];
        this.timeRemaining = GAME_CONFIG.WORLD.MAX_TIME;
    }

    _setupMobileTouch() {
        const bindTouch = (id, action) => {
            const btn = document.getElementById(id);
            if (!btn) return;
            const start = (e) => { e.preventDefault(); this.input.setVirtualButton(action, true); };
            const end = (e) => { e.preventDefault(); this.input.setVirtualButton(action, false); };
            btn.addEventListener('touchstart', start);
            btn.addEventListener('touchend', end);
            btn.addEventListener('mousedown', start);
            btn.addEventListener('mouseup', end);
        };

        bindTouch('btn-left', 'left');
        bindTouch('btn-right', 'right');
        bindTouch('btn-sprint', 'sprint');
        bindTouch('btn-jump', 'jump');
    }

    update(dt) {
        if (!this.mario.isDead) {
            this.timeRemaining = Math.max(0, this.timeRemaining - dt * 0.4);
            if (this.timeRemaining <= 0) {
                this.mario.kill('timeout');
                this.audio.playDeath();
            }
        }

        // Mario Physics & Input
        this.physics.applyForces(this.mario, dt);
        this.mario.update(dt, this.input, this.audio);
        this.physics.resolveTileCollisions(this.mario, this.level, dt);

        // Camera Tracking
        this.camera.update(this.mario);

        // Enemies update & collisions
        for (const enemy of this.level.enemies) {
            if (enemy.markedForRemoval) continue;

            if (this.camera.isVisible(enemy.x, enemy.y, enemy.width, enemy.height, 128)) {
                this.physics.applyForces(enemy, dt);
                enemy.update(dt);
                this.physics.resolveTileCollisions(enemy, this.level, dt);

                // Check Mario vs Enemy
                if (!this.mario.isDead && !enemy.isStomped) {
                    const col = PhysicsEngine.resolveEntityCollision(this.mario, enemy);
                    if (col) {
                        if (col.side === 'top' || (this.mario.vy > 0 && this.mario.y + this.mario.height - enemy.y < 8)) {
                            // Mario Stomp Enemy
                            enemy.stomp();
                            this.mario.bounce();
                            this.audio.playStomp();
                            this.score += 100;
                            this._spawnParticles(enemy.x + 8, enemy.y + 8, '#ffffff', 4);
                        } else {
                            // Mario Dies
                            this.mario.kill('enemy');
                            this.audio.playDeath();
                            setTimeout(() => this._initLevel(), 3000);
                        }
                    }
                }
            }
        }

        // Collectibles check
        for (let i = this.level.collectibles.length - 1; i >= 0; i--) {
            const coin = this.level.collectibles[i];
            coin.update(dt);
            if (!this.mario.isDead && PhysicsEngine.checkAABB(this.mario, coin)) {
                this.audio.playCoin();
                this.coins++;
                this.score += 200;
                this._spawnParticles(coin.x + 6, coin.y + 8, '#fcb42c', 6);
                this.level.collectibles.splice(i, 1);
            }
        }

        // Particles update
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.update(dt);
            if (p.markedForRemoval) {
                this.particles.splice(i, 1);
            }
        }

        // Clean dead enemies
        this.level.enemies = this.level.enemies.filter(e => !e.markedForRemoval);

        // Reset inputs
        this.input.postUpdate();
    }

    _spawnParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const vx = (Math.random() - 0.5) * 160;
            const vy = -Math.random() * 200 - 50;
            this.particles.push(new Particle(x, y, vx, vy, color));
        }
    }

    render(alpha) {
        // Clear background with NES Sky Blue
        this.ctx.fillStyle = '#5c94fc';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 1. Render Cached Level Tiles
        this.level.render(this.ctx, this.camera);

        // 2. Render Collectibles
        for (const coin of this.level.collectibles) {
            coin.render(this.ctx, this.camera);
        }

        // 3. Render Enemies
        for (const enemy of this.level.enemies) {
            enemy.render(this.ctx, this.camera);
        }

        // 4. Render Particles
        for (const particle of this.particles) {
            particle.render(this.ctx, this.camera);
        }

        // 5. Render Mario
        this.mario.render(this.ctx, this.camera);

        // 6. Update HUD Displays
        this._updateHUD();
    }

    _updateHUD() {
        this.scoreElem.textContent = String(this.score).padStart(6, '0');
        this.coinsElem.textContent = `x${String(this.coins).padStart(2, '0')}`;
        this.timeElem.textContent = String(Math.ceil(this.timeRemaining)).padStart(3, '0');

        const stats = this.cache.getStats();
        this.fpsElem.textContent = this.loop.fps;
        this.hitRateElem.textContent = stats.hitRate;
        this.cacheSizeElem.textContent = `${stats.size}/${stats.maxEntries}`;
    }
}

// Launch upon document readiness
window.addEventListener('DOMContentLoaded', () => {
    new MarioGame();
});