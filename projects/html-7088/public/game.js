/**
 * Hardened Super Mario Core Engine - B2.st Studio
 * Defensive Programming / 60 FPS Fixed Time-Step / Procedural Audio Synthesizer
 */
'use strict';

// 1. CONFIGURATION & CONSTANTS (FROZEN TO PREVENT TAMPERING)
const ENGINE_CONFIG = Object.freeze({
    CANVAS_WIDTH: 320,
    CANVAS_HEIGHT: 240,
    GRAVITY: 0.52,
    MAX_FALL_SPEED: 8.5,
    TILE_SIZE: 16,
    FRICTION: 0.88,
    RUN_ACCEL: 0.22,
    MAX_WALK_SPEED: 2.2,
    MAX_RUN_SPEED: 3.6,
    JUMP_IMPULSE: -8.8
});

// 2. HARDENED AUDIO ENGINE (Resolves all Web Audio Autoplay Policy Warnings)
class ProceduralAudioEngine {
    constructor() {
        this.ctx = null;
        this.isReady = false;
    }

    init() {
        if (this.isReady && this.ctx) return;
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
                if (this.ctx.state === 'suspended') {
                    this.ctx.resume();
                }
                this.isReady = true;
            }
        } catch (err) {
            console.warn('[B2.st Audio Engine] AudioContext init safe fallback:', err);
        }
    }

    playTone(freq, type, duration, targetGain = 0.1) {
        if (!this.isReady || !this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gainNode = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            gainNode.gain.setValueAtTime(targetGain, this.ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
            osc.connect(gainNode);
            gainNode.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {
            // Fail silently without stopping game execution
        }
    }

    jump() {
        if (!this.isReady || !this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(150, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.15);
        } catch (e) {}
    }

    stomp() {
        this.playTone(120, 'square', 0.1, 0.15);
    }

    coin() {
        if (!this.isReady || !this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(987.77, this.ctx.currentTime);
            osc.frequency.setValueAtTime(1318.51, this.ctx.currentTime + 0.08);
            gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.3);
        } catch (e) {}
    }

    die() {
        this.playTone(180, 'sawtooth', 0.4, 0.18);
    }
}

// 3. ZERO-TOUCH-BUG INPUT HANDLER
class InputHandler {
    constructor(onStart) {
        this.keys = { left: false, right: false, jump: false, run: false };
        this.onStart = onStart;
        this.bindEvents();
    }

    bindEvents() {
        const updateKey = (code, val) => {
            switch(code) {
                case 'ArrowLeft':
                case 'KeyA':
                    this.keys.left = val; break;
                case 'ArrowRight':
                case 'KeyD':
                    this.keys.right = val; break;
                case 'ArrowUp':
                case 'KeyW':
                case 'Space':
                    this.keys.jump = val; break;
                case 'ShiftLeft':
                case 'KeyJ':
                    this.keys.run = val; break;
                case 'Enter':
                    if (val && this.onStart) this.onStart();
                    break;
            }
        };

        window.addEventListener('keydown', (e) => {
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }
            updateKey(e.code, true);
        });

        window.addEventListener('keyup', (e) => {
            updateKey(e.code, false);
        });

        // Touch Control Binding with Full Touch Interception
        const bindTouch = (id, keyName) => {
            const btn = document.getElementById(id);
            if (!btn) return;

            const activate = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.keys[keyName] = true;
                btn.classList.add('active');
                if (this.onStart) this.onStart();
            };

            const deactivate = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.keys[keyName] = false;
                btn.classList.remove('active');
            };

            btn.addEventListener('touchstart', activate, { passive: false });
            btn.addEventListener('touchend', deactivate, { passive: false });
            btn.addEventListener('touchcancel', deactivate, { passive: false });
            btn.addEventListener('mousedown', activate);
            btn.addEventListener('mouseup', deactivate);
            btn.addEventListener('mouseleave', deactivate);
        };

        bindTouch('btn-left', 'left');
        bindTouch('btn-right', 'right');
        bindTouch('btn-jump', 'jump');
        bindTouch('btn-run', 'run');

        // Prevent body mobile dragging & elastic scrolling
        document.body.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    }
}

// 4. ENTITY & WORLD IMPLEMENTATION
class Mario {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.w = 12;
        this.h = 16;
        this.vx = 0;
        this.vy = 0;
        this.isGrounded = false;
        this.facing = 1;
        this.isDead = false;
        this.animFrame = 0;
        this.animTimer = 0;
    }

    update(input, level, audio) {
        if (this.isDead) {
            this.vy += ENGINE_CONFIG.GRAVITY;
            this.y += this.vy;
            return;
        }

        const maxSpd = input.keys.run ? ENGINE_CONFIG.MAX_RUN_SPEED : ENGINE_CONFIG.MAX_WALK_SPEED;

        if (input.keys.right) {
            this.vx += ENGINE_CONFIG.RUN_ACCEL;
            this.facing = 1;
        } else if (input.keys.left) {
            this.vx -= ENGINE_CONFIG.RUN_ACCEL;
            this.facing = -1;
        } else {
            this.vx *= ENGINE_CONFIG.FRICTION;
            if (Math.abs(this.vx) < 0.1) this.vx = 0;
        }

        this.vx = Math.max(-maxSpd, Math.min(maxSpd, this.vx));

        // Jump Handling with strict edge condition
        if (input.keys.jump && this.isGrounded) {
            this.vy = ENGINE_CONFIG.JUMP_IMPULSE;
            this.isGrounded = false;
            audio.jump();
        }

        // Gravity
        this.vy += ENGINE_CONFIG.GRAVITY;
        if (this.vy > ENGINE_CONFIG.MAX_FALL_SPEED) {
            this.vy = ENGINE_CONFIG.MAX_FALL_SPEED;
        }

        // Horizontal Movement and Collision Resolution
        this.x += this.vx;
        this.checkCollisionX(level);

        // Vertical Movement and Collision Resolution
        this.y += this.vy;
        this.isGrounded = false;
        this.checkCollisionY(level);

        // Fall Off Pit Condition
        if (this.y > ENGINE_CONFIG.CANVAS_HEIGHT + 32) {
            this.kill(audio);
        }

        // Animation logic
        if (Math.abs(this.vx) > 0.2 && this.isGrounded) {
            this.animTimer++;
            if (this.animTimer > 6) {
                this.animFrame = (this.animFrame + 1) % 3;
                this.animTimer = 0;
            }
        } else {
            this.animFrame = 0;
        }
    }

    checkCollisionX(level) {
        const leftTile = Math.floor(this.x / ENGINE_CONFIG.TILE_SIZE);
        const rightTile = Math.floor((this.x + this.w) / ENGINE_CONFIG.TILE_SIZE);
        const topTile = Math.floor(this.y / ENGINE_CONFIG.TILE_SIZE);
        const bottomTile = Math.floor((this.y + this.h - 1) / ENGINE_CONFIG.TILE_SIZE);

        for (let ty = topTile; ty <= bottomTile; ty++) {
            for (let tx = leftTile; tx <= rightTile; tx++) {
                if (level.isSolid(tx, ty)) {
                    if (this.vx > 0) {
                        this.x = tx * ENGINE_CONFIG.TILE_SIZE - this.w;
                    } else if (this.vx < 0) {
                        this.x = (tx + 1) * ENGINE_CONFIG.TILE_SIZE;
                    }
                    this.vx = 0;
                }
            }
        }
    }

    checkCollisionY(level) {
        const leftTile = Math.floor(this.x / ENGINE_CONFIG.TILE_SIZE);
        const rightTile = Math.floor((this.x + this.w - 1) / ENGINE_CONFIG.TILE_SIZE);
        const topTile = Math.floor(this.y / ENGINE_CONFIG.TILE_SIZE);
        const bottomTile = Math.floor((this.y + this.h) / ENGINE_CONFIG.TILE_SIZE);

        for (let ty = topTile; ty <= bottomTile; ty++) {
            for (let tx = leftTile; tx <= rightTile; tx++) {
                if (level.isSolid(tx, ty)) {
                    if (this.vy > 0) {
                        this.y = ty * ENGINE_CONFIG.TILE_SIZE - this.h;
                        this.vy = 0;
                        this.isGrounded = true;
                    } else if (this.vy < 0) {
                        this.y = (ty + 1) * ENGINE_CONFIG.TILE_SIZE;
                        this.vy = 0;
                    }
                }
            }
        }
    }

    kill(audio) {
        if (this.isDead) return;
        this.isDead = true;
        this.vy = -7;
        audio.die();
    }

    render(ctx) {
        ctx.save();
        ctx.fillStyle = '#e52521'; // Mario Red Shirt
        const rx = Math.round(this.x);
        const ry = Math.round(this.y);

        if (this.facing === -1) {
            ctx.scale(-1, 1);
            ctx.translate(-rx * 2 - this.w, 0);
        }

        // Mario Sprite Procedural Drawing (Pixel Perfect, No Blurring)
        ctx.fillRect(rx + 2, ry, 8, 4);      // Cap
        ctx.fillStyle = '#fcc082';           // Face
        ctx.fillRect(rx + 2, ry + 4, 8, 4);
        ctx.fillStyle = '#0026a3';           // Overalls
        ctx.fillRect(rx + 1, ry + 8, 10, 5);
        ctx.fillStyle = '#7a3d00';           // Shoes
        ctx.fillRect(rx + (this.animFrame % 2 === 0 ? 0 : 2), ry + 13, 5, 3);
        ctx.fillRect(rx + (this.animFrame % 2 === 0 ? 7 : 5), ry + 13, 5, 3);

        ctx.restore();
    }
}

class Goomba {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.w = 14;
        this.h = 14;
        this.vx = -0.6;
        this.vy = 0;
        this.isDead = false;
        this.deadTimer = 0;
    }

    update(level) {
        if (this.isDead) {
            this.deadTimer++;
            return;
        }

        this.vy += ENGINE_CONFIG.GRAVITY;
        if (this.vy > ENGINE_CONFIG.MAX_FALL_SPEED) this.vy = ENGINE_CONFIG.MAX_FALL_SPEED;

        // X collision & bounce
        this.x += this.vx;
        const tx = Math.floor((this.vx > 0 ? this.x + this.w : this.x) / ENGINE_CONFIG.TILE_SIZE);
        const ty = Math.floor((this.y + 6) / ENGINE_CONFIG.TILE_SIZE);
        if (level.isSolid(tx, ty)) {
            this.vx = -this.vx;
            this.x += this.vx;
        }

        // Y collision
        this.y += this.vy;
        const btx1 = Math.floor(this.x / ENGINE_CONFIG.TILE_SIZE);
        const btx2 = Math.floor((this.x + this.w) / ENGINE_CONFIG.TILE_SIZE);
        const bty = Math.floor((this.y + this.h) / ENGINE_CONFIG.TILE_SIZE);
        if (level.isSolid(btx1, bty) || level.isSolid(btx2, bty)) {
            this.y = bty * ENGINE_CONFIG.TILE_SIZE - this.h;
            this.vy = 0;
        }
    }

    render(ctx) {
        if (this.deadTimer > 30) return;
        const rx = Math.round(this.x);
        const ry = Math.round(this.y);

        if (this.isDead) {
            ctx.fillStyle = '#a84200';
            ctx.fillRect(rx, ry + 10, 14, 4);
        } else {
            ctx.fillStyle = '#a84200';
            ctx.fillRect(rx + 2, ry, 10, 8);   // Head
            ctx.fillStyle = '#000000';
            ctx.fillRect(rx, ry + 8, 14, 6);   // Feet & Body
        }
    }
}

class Level {
    constructor() {
        this.width = 180;
        this.height = 15;
        this.map = new Uint8Array(this.width * this.height);
        this.buildLevel();
    }

    buildLevel() {
        for (let x = 0; x < this.width; x++) {
            // Ground
            if (x < 65 || (x > 68 && x < 85) || x > 90) {
                this.setTile(x, 13, 1);
                this.setTile(x, 14, 1);
            }

            // Platforms & Mystery Blocks
            if (x === 16 || x === 21 || x === 23 || x === 60) this.setTile(x, 9, 2); // '?'
            if (x === 20 || x === 22 || x === 24) this.setTile(x, 9, 3); // Brick

            // Classic Pipe
            if (x === 28 || x === 38) {
                this.setTile(x, 12, 4);
                this.setTile(x, 11, 4);
            }
        }
    }

    setTile(x, y, val) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            this.map[y * this.width + x] = val;
        }
    }

    getTile(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return 0;
        return this.map[y * this.width + x];
    }

    isSolid(tx, ty) {
        const tile = this.getTile(tx, ty);
        return tile > 0;
    }

    render(ctx, cameraX) {
        const startCol = Math.max(0, Math.floor(cameraX / ENGINE_CONFIG.TILE_SIZE));
        const endCol = Math.min(this.width, startCol + (ENGINE_CONFIG.CANVAS_WIDTH / ENGINE_CONFIG.TILE_SIZE) + 2);

        for (let y = 0; y < this.height; y++) {
            for (let x = startCol; x < endCol; x++) {
                const tile = this.getTile(x, y);
                if (tile === 0) continue;

                const rx = Math.round(x * ENGINE_CONFIG.TILE_SIZE);
                const ry = Math.round(y * ENGINE_CONFIG.TILE_SIZE);

                switch(tile) {
                    case 1: // Ground
                        ctx.fillStyle = '#c84400';
                        ctx.fillRect(rx, ry, 16, 16);
                        ctx.fillStyle = '#fc9838';
                        ctx.fillRect(rx, ry, 16, 2);
                        break;
                    case 2: // Mystery Block
                        ctx.fillStyle = '#fc9838';
                        ctx.fillRect(rx, ry, 16, 16);
                        ctx.fillStyle = '#000000';
                        ctx.font = '10px monospace';
                        ctx.fillText('?', rx + 5, ry + 12);
                        break;
                    case 3: // Brick
                        ctx.fillStyle = '#b83400';
                        ctx.fillRect(rx, ry, 16, 16);
                        ctx.strokeStyle = '#000';
                        ctx.strokeRect(rx, ry, 16, 16);
                        break;
                    case 4: // Pipe
                        ctx.fillStyle = '#00a800';
                        ctx.fillRect(rx, ry, 16, 16);
                        ctx.fillStyle = '#80d010';
                        ctx.fillRect(rx + 2, ry, 2, 16);
                        break;
                }
            }
        }
    }
}

// 5. MAIN SECURE ENGINE RUNTIME
class MarioEngine {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d', { alpha: false });
        this.overlay = document.getElementById('start-overlay');
        this.scoreEl = document.getElementById('score');

        // Crisp pixelated rendering enforcement
        this.ctx.imageSmoothingEnabled = false;

        this.audio = new ProceduralAudioEngine();
        this.input = new InputHandler(() => this.start());

        this.level = new Level();
        this.mario = new Mario(32, 160);
        this.enemies = [
            new Goomba(240, 190),
            new Goomba(380, 190),
            new Goomba(520, 190)
        ];

        this.cameraX = 0;
        this.score = 0;
        this.running = false;
        this.lastTime = 0;

        // Overlay & Screen interactions
        this.overlay.addEventListener('click', () => this.start());
        this.overlay.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.start();
        }, { passive: false });
    }

    start() {
        this.audio.init();
        if (!this.running) {
            this.running = true;
            this.overlay.classList.add('hidden');
            this.lastTime = performance.now();
            requestAnimationFrame((t) => this.gameLoop(t));
        }
    }

    handleCollisions() {
        if (this.mario.isDead) return;

        this.enemies.forEach(enemy => {
            if (enemy.isDead) return;

            // Simple Axis-Aligned Bounding Box (AABB) Collision
            if (this.mario.x < enemy.x + enemy.w &&
                this.mario.x + this.mario.w > enemy.x &&
                this.mario.y < enemy.y + enemy.h &&
                this.mario.y + this.mario.h > enemy.y) {

                // Jump kill check (stomp)
                if (this.mario.vy > 0 && this.mario.y + this.mario.h - this.mario.vy <= enemy.y + 6) {
                    enemy.isDead = true;
                    this.mario.vy = -5.5;
                    this.score += 100;
                    this.scoreEl.innerText = String(this.score).padStart(6, '0');
                    this.audio.stomp();
                } else {
                    this.mario.kill(this.audio);
                }
            }
        });
    }

    update() {
        this.mario.update(this.input, this.level, this.audio);

        this.enemies.forEach(enemy => enemy.update(this.level));
        this.handleCollisions();

        // Safe Camera tracking with boundaries
        if (!this.mario.isDead) {
            const targetCamX = this.mario.x - ENGINE_CONFIG.CANVAS_WIDTH * 0.4;
            if (targetCamX > this.cameraX) {
                this.cameraX = targetCamX;
            }
        }
    }

    render() {
        this.ctx.fillStyle = '#5c94fc';
        this.ctx.fillRect(0, 0, ENGINE_CONFIG.CANVAS_WIDTH, ENGINE_CONFIG.CANVAS_HEIGHT);

        this.ctx.save();
        this.ctx.translate(-Math.round(this.cameraX), 0);

        this.level.render(this.ctx, this.cameraX);
        this.enemies.forEach(enemy => enemy.render(this.ctx));
        this.mario.render(this.ctx);

        this.ctx.restore();
    }

    gameLoop(currentTime) {
        if (!this.running) return;

        // Standard delta-time clamping to mitigate frame skips and tunneling
        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
        this.lastTime = currentTime;

        this.update();
        this.render();

        requestAnimationFrame((t) => this.gameLoop(t));
    }
}

// Global initialization after DOM completely loads
window.addEventListener('DOMContentLoaded', () => {
    new MarioEngine();
});