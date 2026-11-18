/**
 * Core Game Coordinator & State Machine
 * Layer: Central Engine
 * Studio: B2.st
 */

import { CONFIG } from '../../config/game_config.js';
import { GameLoop } from './game_loop.js';
import { Camera } from './camera.js';
import { PhysicsEngine } from './physics.js';
import { InputHandler } from './input.js';
import { SoundEngine } from './audio.js';
import { SpriteGenerator } from '../entities/sprite_generator.js';
import { Mario } from '../entities/mario.js';
import { Goomba } from '../entities/goomba.js';
import { Mushroom } from '../entities/mushroom.js';
import { Particle } from '../entities/particle.js';
import { TileMap } from '../levels/tile_map.js';
import { LEVEL_1_1 } from '../levels/level_data.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;

    this.state = 'START'; // START, PLAYING, GAME_OVER, VICTORY, PAUSED
    this.levelTime = 400;
    this.timeCounter = 0;

    // Services
    this.spriteGen = new SpriteGenerator();
    this.sound = new SoundEngine();
    this.input = new InputHandler();
    this.camera = new Camera(CONFIG.CANVAS.WIDTH, CONFIG.CANVAS.HEIGHT);

    this.entities = [];
    this.particles = [];

    this.initLevel();

    this.loop = new GameLoop(
      this.update.bind(this),
      this.render.bind(this),
      CONFIG.CANVAS.FPS
    );
  }

  initLevel() {
    this.tileMap = new TileMap(LEVEL_1_1, this.spriteGen);
    this.tileMap.onSpawnMushroom = (x, y) => {
      this.entities.push(new Mushroom(x, y, this.spriteGen));
      this.sound.playPowerup();
    };

    this.physics = new PhysicsEngine(this.tileMap);
    this.camera.reset();
    this.camera.setLevelBounds(this.tileMap.width * CONFIG.TILE_SIZE);

    this.mario = new Mario(LEVEL_1_1.marioStart.x, LEVEL_1_1.marioStart.y, this.spriteGen, this.sound);
    this.mario.tileMap = this.tileMap;

    this.entities = [];
    this.particles = [];

    // Spawn Goombas
    LEVEL_1_1.goombas.forEach(g => {
      this.entities.push(new Goomba(g.x, g.y, this.spriteGen));
    });

    this.levelTime = 400;
    this.timeCounter = 0;
  }

  start() {
    this.state = 'PLAYING';
    this.loop.start();
  }

  restart() {
    this.initLevel();
    this.state = 'PLAYING';
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
    }
  }

  update(deltaTime) {
    if (this.state !== 'PLAYING') return;

    // Level timer countdown
    this.timeCounter += deltaTime;
    if (this.timeCounter >= 1.0) {
      this.timeCounter -= 1.0;
      this.levelTime = Math.max(0, this.levelTime - 1);
      if (this.levelTime === 0 && !this.mario.isDying) {
        this.mario.die();
      }
    }

    // Mario Control & Physics
    this.mario.updateControls(this.input, deltaTime);
    this.mario.update(deltaTime);
    this.physics.updateEntity(this.mario, deltaTime);

    // Camera follow
    if (!this.mario.isDying) {
      this.camera.follow(this.mario);
    }

    // Entities update & collisions
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const entity = this.entities[i];
      entity.update(deltaTime);
      this.physics.updateEntity(entity, deltaTime);

      if (entity.markedForRemoval) {
        this.entities.splice(i, 1);
        continue;
      }

      // Check collision with Mario
      if (!this.mario.isDying && PhysicsEngine.checkAABB(this.mario.getBounds(), entity.getBounds())) {
        this.handleMarioEntityCollision(entity);
      }
    }

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update(deltaTime);
      if (this.particles[i].markedForRemoval) {
        this.particles.splice(i, 1);
      }
    }

    // Flagpole Check (Goal)
    const marioTileX = Math.floor((this.mario.position.x + this.mario.width / 2) / CONFIG.TILE_SIZE);
    const tileUnder = this.tileMap.getTile(marioTileX, Math.floor(this.mario.position.y / CONFIG.TILE_SIZE));
    if (tileUnder && tileUnder.isGoal) {
      this.state = 'VICTORY';
      this.sound.playWin();
    }

    // Game Over check
    if (this.mario.isDying && this.mario.deathTimer > 3.0) {
      this.state = 'GAME_OVER';
    }
  }

  handleMarioEntityCollision(entity) {
    if (entity instanceof Goomba) {
      if (entity.squashed) return;

      // Mario jumping on top of Goomba
      const isFalling = this.mario.velocity.y > 0;
      const marioBottom = this.mario.position.y + this.mario.height;
      const goombaTop = entity.position.y;

      if (isFalling && marioBottom - goombaTop < 10) {
        entity.squash();
        this.mario.bounce();
        this.sound.playStomp();
        this.mario.score += 100;
        this.particles.push(new Particle(entity.x, entity.y, '100'));
      } else {
        this.mario.shrink();
      }
    } else if (entity instanceof Mushroom) {
      entity.markedForRemoval = true;
      this.mario.grow();
      this.mario.score += 1000;
      this.particles.push(new Particle(entity.x, entity.y, '1000', '#00e000'));
    }
  }

  renderHUD() {
    this.ctx.save();
    this.ctx.font = 'bold 9px monospace';
    this.ctx.fillStyle = '#ffffff';

    // Classic NES Mario Top HUD
    this.ctx.fillText('MARIO', 16, 12);
    this.ctx.fillText(String(this.mario.score).padStart(6, '0'), 16, 22);

    this.ctx.fillText('COINS', 110, 12);
    this.ctx.fillText(`*${String(this.mario.coins).padStart(2, '0')}`, 110, 22);

    this.ctx.fillText('WORLD', 210, 12);
    this.ctx.fillText('1-1', 216, 22);

    this.ctx.fillText('TIME', 320, 12);
    this.ctx.fillText(String(this.levelTime).padStart(3, '0'), 326, 22);
    this.ctx.restore();
  }

  renderOverlay() {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    this.ctx.fillRect(0, 0, CONFIG.CANVAS.WIDTH, CONFIG.CANVAS.HEIGHT);

    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 16px monospace';

    if (this.state === 'START') {
      this.ctx.fillText('SUPER MARIO B2', CONFIG.CANVAS.WIDTH / 2, CONFIG.CANVAS.HEIGHT / 2 - 20);
      this.ctx.font = '10px monospace';
      this.ctx.fillText('PRESS JUMP OR TAP TO START', CONFIG.CANVAS.WIDTH / 2, CONFIG.CANVAS.HEIGHT / 2 + 10);
      this.ctx.fillText('ARROWS/WASD: MOVE | SPACE: JUMP | SHIFT: RUN', CONFIG.CANVAS.WIDTH / 2, CONFIG.CANVAS.HEIGHT / 2 + 30);
    } else if (this.state === 'PAUSED') {
      this.ctx.fillText('PAUSED', CONFIG.CANVAS.WIDTH / 2, CONFIG.CANVAS.HEIGHT / 2);
    } else if (this.state === 'GAME_OVER') {
      this.ctx.fillStyle = '#ff4444';
      this.ctx.fillText('GAME OVER', CONFIG.CANVAS.WIDTH / 2, CONFIG.CANVAS.HEIGHT / 2 - 10);
      this.ctx.font = '10px monospace';
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillText('PRESS RESTART TO TRY AGAIN', CONFIG.CANVAS.WIDTH / 2, CONFIG.CANVAS.HEIGHT / 2 + 20);
    } else if (this.state === 'VICTORY') {
      this.ctx.fillStyle = '#ffbc00';
      this.ctx.fillText('COURSE CLEAR!', CONFIG.CANVAS.WIDTH / 2, CONFIG.CANVAS.HEIGHT / 2 - 10);
      this.ctx.font = '10px monospace';
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillText(`FINAL SCORE: ${this.mario.score}`, CONFIG.CANVAS.WIDTH / 2, CONFIG.CANVAS.HEIGHT / 2 + 20);
    }
    this.ctx.restore();
  }

  render() {
    // Clear background sky
    this.ctx.fillStyle = CONFIG.CANVAS.CLEAR_COLOR;
    this.ctx.fillRect(0, 0, CONFIG.CANVAS.WIDTH, CONFIG.CANVAS.HEIGHT);

    // Draw Map & Scenery
    this.tileMap.render(this.ctx, this.camera);

    // Draw Entities
    for (const entity of this.entities) {
      if (this.camera.isVisible(entity.x, entity.y, entity.width, entity.height)) {
        entity.render(this.ctx, this.camera);
      }
    }

    // Draw Mario
    this.mario.render(this.ctx, this.camera);

    // Draw Particles
    for (const p of this.particles) {
      p.render(this.ctx, this.camera);
    }

    // Draw NES HUD
    this.renderHUD();

    // Overlay modal states
    if (this.state !== 'PLAYING') {
      this.renderOverlay();
    }
  }

  getCacheMetrics() {
    return this.spriteGen.cache.getStats();
  }
}