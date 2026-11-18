import { GameLoop } from './GameLoop.js';
import { Camera } from './Camera.js';
import { Physics } from './Physics.js';
import { InputHandler } from './InputHandler.js';
import { Mario } from '../entities/Mario.js';
import { Goomba } from '../entities/Goomba.js';
import { Coin } from '../entities/Coin.js';
import { TileMap } from '../levels/TileMap.js';
import { createLevel1 } from '../levels/Level1.js';
import { GAME_CONFIG } from '../../config/game.config.js';

/**
 * Procedural Web Audio 8-bit Synthesizer
 */
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  _init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playJump() {
    if (this.muted) return;
    this._init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playCoin() {
    if (this.muted) return;
    this._init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(987, this.ctx.currentTime);
    osc.frequency.setValueAtTime(1318, this.ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.35);
  }

  playStomp() {
    if (this.muted) return;
    this._init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playBump() {
    if (this.muted) return;
    this._init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(90, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  playDeath() {
    if (this.muted) return;
    this._init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(120, this.ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.5);
  }
}

/**
 * Main Mario Game Orchestrator
 */
export class Game {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d', { alpha: false });
    this.ctx.imageSmoothingEnabled = false;

    this.score = 0;
    this.coins = 0;
    this.world = '1-1';
    this.time = 400;
    this.lives = GAME_CONFIG.MARIO.INITIAL_LIVES;
    this.isPaused = false;
    this.gameWon = false;

    this.soundEngine = new SoundEngine();
    this.input = new InputHandler();
    this.camera = new Camera(GAME_CONFIG.CANVAS.WIDTH, GAME_CONFIG.CANVAS.HEIGHT);

    this.entities = [];
    this.initLevel();

    this.loop = new GameLoop(
      GAME_CONFIG.TIMING.FIXED_DELTA,
      (dt) => this.update(dt),
      (alpha) => this.render(alpha)
    );
  }

  initLevel() {
    const levelData = createLevel1();
    this.levelWidth = levelData.width;
    this.tileMap = new TileMap(levelData.matrix, GAME_CONFIG.PHYSICS.TILE_SIZE);

    this.mario = new Mario(levelData.spawnMario.x, levelData.spawnMario.y);
    this.mario.gameContext = this;

    this.entities = [];
    levelData.spawns.forEach((spawn) => {
      if (spawn.type === 'goomba') {
        const g = new Goomba(spawn.x, spawn.y);
        g.gameContext = this;
        this.entities.push(g);
      } else if (spawn.type === 'coin') {
        const c = new Coin(spawn.x, spawn.y, true);
        c.gameContext = this;
        this.entities.push(c);
      }
    });

    this.camera.reset();
    this.time = 400;
  }

  spawnPoppedCoin(x, y) {
    const coin = new Coin(x, y, false);
    coin.gameContext = this;
    this.entities.push(coin);
    this.soundEngine.playCoin();
  }

  addScore(points) {
    this.score += points;
  }

  addCoin() {
    this.coins += 1;
    if (this.coins >= 100) {
      this.coins = 0;
      this.lives += 1;
    }
  }

  update(dt) {
    this.input.update();

    if (this.input.justPressed.pause) {
      this.isPaused = !this.isPaused;
    }
    if (this.input.justPressed.mute) {
      this.soundEngine.muted = !this.soundEngine.muted;
    }

    if (this.isPaused) {
      this.input.postUpdate();
      return;
    }

    if (this.mario.state !== 'DEAD' && !this.gameWon) {
      this.time = Math.max(0, this.time - dt * 1.5);
      if (this.time <= 0) {
        this.mario.kill(this.soundEngine);
      }
    }

    // Mario update
    this.mario.update(dt, this.input, this.soundEngine);

    // Apply gravity
    Physics.applyGravity(
      this.mario,
      GAME_CONFIG.PHYSICS.GRAVITY,
      GAME_CONFIG.PHYSICS.MAX_FALL_SPEED,
      dt
    );

    // Resolve tilemap collision
    Physics.resolveTileMapCollisions(this.mario, this.tileMap, GAME_CONFIG.PHYSICS.TILE_SIZE);

    // Fall in pit check
    if (this.mario.position.y > GAME_CONFIG.CANVAS.HEIGHT && this.mario.state !== 'DEAD') {
      this.mario.kill(this.soundEngine);
    }

    // Camera follow Mario
    this.camera.update(this.mario, this.levelWidth);

    // TileMap bump animations
    this.tileMap.update(dt);

    // Update Entities & Collisions
    const marioBox = this.mario.getBounds();

    for (let i = this.entities.length - 1; i >= 0; i--) {
      const e = this.entities[i];
      e.update(dt, this.soundEngine);

      // Goomba / Enemy gravity & tiles
      if (e instanceof Goomba && !e.isSquashed) {
        Physics.applyGravity(
          e,
          GAME_CONFIG.PHYSICS.GRAVITY,
          GAME_CONFIG.PHYSICS.MAX_FALL_SPEED,
          dt
        );
        Physics.resolveTileMapCollisions(e, this.tileMap, GAME_CONFIG.PHYSICS.TILE_SIZE);
      }

      // Mario vs Entity collision check
      if (this.mario.state !== 'DEAD' && Physics.checkAABB(marioBox, e.getBounds())) {
        if (e instanceof Coin) {
          e.collect(this.soundEngine);
          this.addCoin();
          this.addScore(200);
        } else if (e instanceof Goomba && !e.isSquashed) {
          // Check if Mario stomped Goomba from above
          if (this.mario.velocity.y > 0 && this.mario.position.y + this.mario.size.y - 8 < e.position.y + 6) {
            e.stomp(this.soundEngine);
            this.mario.velocity.y = GAME_CONFIG.PHYSICS.BOUNCE_FORCE;
            this.addScore(100);
          } else {
            // Mario damaged
            this.mario.kill(this.soundEngine);
          }
        }
      }

      if (e.markedForRemoval) {
        this.entities.splice(i, 1);
      }
    }

    // Flagpole Goal check (at column 110: x ~ 1760)
    if (this.mario.position.x >= 1760 && !this.gameWon) {
      this.gameWon = true;
      this.addScore(1000);
    }

    // Respawn after death
    if (this.mario.state === 'DEAD' && this.mario.position.y > GAME_CONFIG.CANVAS.HEIGHT + 80) {
      this.lives -= 1;
      if (this.lives > 0) {
        this.initLevel();
      } else {
        // Game Over reset
        this.lives = GAME_CONFIG.MARIO.INITIAL_LIVES;
        this.score = 0;
        this.coins = 0;
        this.initLevel();
      }
    }

    this.input.postUpdate();
  }

  render() {
    const ctx = this.ctx;

    // Background Sky
    ctx.fillStyle = GAME_CONFIG.CANVAS.BACKGROUND_COLOR;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Decorative clouds and bushes
    this._renderScenery(ctx);

    // Level TileMap
    this.tileMap.render(ctx, this.camera);

    // Entities
    for (const entity of this.entities) {
      entity.render(ctx, this.camera);
    }

    // Mario
    this.mario.render(ctx, this.camera);

    // Pause Overlay
    if (this.isPaused) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
    }

    // Victory Banner
    if (this.gameWon) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('COURSE CLEAR! CONGRATULATIONS B2.ST', this.canvas.width / 2, 70);
    }
  }

  _renderScenery(ctx) {
    // Parallax background clouds
    const cloudOffsets = [40, 200, 360, 600, 840, 1100, 1400];
    ctx.fillStyle = '#ffffff';
    for (const cx of cloudOffsets) {
      const scr = this.camera.worldToScreen(cx, 40);
      if (scr.x > -60 && scr.x < this.canvas.width + 60) {
        ctx.fillRect(scr.x, scr.y, 36, 12);
        ctx.fillRect(scr.x + 8, scr.y - 6, 20, 6);
      }
    }
  }

  start() {
    this.loop.start();
  }
}