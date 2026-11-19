/**
 * Mario Game Master Controller & ECS Orchestrator
 * Studio: B2.st
 */

import { GameConfig } from '../config/game.config.js';
import { GameLoop } from './engine/GameLoop.js';
import { Camera } from './engine/Camera.js';
import { InputHandler } from './engine/InputHandler.js';
import { Physics } from './engine/Physics.js';
import { Level1 } from './levels/Level1.js';
import { Mario } from './entities/Mario.js';
import { Goomba } from './entities/Goomba.js';
import { Koopa } from './entities/Koopa.js';
import { globalSpriteCache, globalPhysicsCache, globalActionLimiter } from './core/performance_cache.js';

export class MarioGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d', { alpha: false });
        this.ctx.imageSmoothingEnabled = false;

        this.canvas.width = GameConfig.canvas.width;
        this.canvas.height = GameConfig.canvas.height;

        this.camera = new Camera(GameConfig.canvas.width, GameConfig.canvas.height);
        this.input = new InputHandler();
        
        this.entities = [];
        this.mario = null;
        this.tileMap = null;
        this.timeRemaining = 400;
        this.secondCounter = 0;
        this.isPaused = false;

        // Hook pause toggle
        this.input.onPauseToggle = () => {
            this.isPaused = !this.isPaused;
        };

        this.initLevel();

        this.loop = new GameLoop(
            (dt) => this.update(dt),
            (alpha) => this.render(alpha),
            GameConfig.canvas.fps
        );
    }

    initLevel() {
        const levelData = Level1.create();
        this.tileMap = levelData.tileMap;
        this.camera.setLevelBounds(this.tileMap.width);

        this.mario = new Mario(levelData.marioSpawn.x, levelData.marioSpawn.y);
        this.entities = [this.mario];

        // Populate level enemies
        levelData.enemySpawns.forEach(spawn => {
            if (spawn.type === 'goomba') {
                this.entities.push(new Goomba(spawn.x, spawn.y));
            } else if (spawn.type === 'koopa') {
                this.entities.push(new Koopa(spawn.x, spawn.y));
            }
        });

        this.timeRemaining = 400;
        this.camera.reset();
    }

    start() {
        this.loop.start();
    }

    update(dt) {
        if (this.isPaused) return;

        // Decrement game clock
        this.secondCounter += dt;
        if (this.secondCounter >= 1.0) {
            this.secondCounter = 0;
            if (this.timeRemaining > 0 && !this.mario.isDead) {
                this.timeRemaining--;
                if (this.timeRemaining <= 0) {
                    this.mario.die();
                }
            }
        }

        // 1. Update Mario with Input
        this.mario.update(dt, this.input);

        // 2. Update all other entities
        for (let i = this.entities.length - 1; i >= 0; i--) {
            const entity = this.entities[i];
            if (entity !== this.mario) {
                // Activate enemies only when camera approaches
                if (Math.abs(entity.pos.x - this.camera.x) < GameConfig.canvas.width + 64) {
                    entity.update(dt);
                }
            }

            // Tilemap Collisions
            Physics.updateEntityTilePhysics(entity, this.tileMap, dt);

            // Clean up off-screen dead entities
            if (!entity.isAlive && entity !== this.mario) {
                this.entities.splice(i, 1);
            }
        }

        // 3. Resolve Inter-entity Collisions (Mario vs Enemies, Shells vs Enemies)
        for (let i = 0; i < this.entities.length; i++) {
            for (let j = i + 1; j < this.entities.length; j++) {
                Physics.resolveEntityOverlap(this.entities[i], this.entities[j]);
            }
        }

        // 4. Smooth Camera Tracking
        this.camera.update(this.mario);

        // 5. Periodic Active Purge of expired cache entries (every 10 seconds)
        if (Math.random() < 0.005) {
            globalPhysicsCache.purgeExpired();
        }

        // Auto restart if Mario died and fallen off
        if (this.mario.isDead && this.mario.deathTimer > 3.0) {
            this.initLevel();
        }
    }

    render(alpha) {
        // Clear background with classic NES sky blue
        this.ctx.fillStyle = GameConfig.canvas.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Render TileMap (Offscreen cache accelerated)
        this.tileMap.render(this.ctx, this.camera);

        // Render Entities
        for (let i = 0; i < this.entities.length; i++) {
            this.entities[i].render(this.ctx, this.camera);
        }

        // Draw Pause overlay
        if (this.isPaused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '12px "Courier New", monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
        }

        // Emit real-time telemetry to DOM HUD
        this.updateHUD();
    }

    updateHUD() {
        const scoreElem = document.getElementById('hud-score');
        const coinsElem = document.getElementById('hud-coins');
        const timeElem = document.getElementById('hud-time');
        const cacheElem = document.getElementById('hud-cache-stats');

        if (scoreElem) scoreElem.textContent = String(this.mario.score).padStart(6, '0');
        if (coinsElem) coinsElem.textContent = `x${String(this.mario.coins).padStart(2, '0')}`;
        if (timeElem) timeElem.textContent = String(this.timeRemaining).padStart(3, '0');

        if (cacheElem) {
            const spriteStats = globalSpriteCache.getTelemetry();
            cacheElem.innerHTML = `
                <span>CACHE: ${spriteStats.size}/${spriteStats.maxEntries}</span> | 
                <span>HITS: ${spriteStats.hits}</span> | 
                <span>RATIO: ${spriteStats.hitRatio}</span> | 
                <span>THROTTLED: ${globalActionLimiter.throttledEvents}</span>
            `;
        }
    }
}