/**
 * Game Orchestrator & Bootstrapper - Studio B2.st
 * Full state coordination, entity lifecycle, audio trigger, and canvas scaling
 */

import { CONFIG } from '../config/game.config.js';
import { GameLoop } from './engine/GameLoop.js';
import { InputManager } from './engine/Input.js';
import { Camera } from './engine/Camera.js';
import { Renderer } from './engine/Renderer.js';
import { Physics } from './engine/Physics.js';
import { sound } from './engine/Audio.js';
import { Mario } from './entities/Mario.js';
import { Goomba, Koopa } from './entities/Enemies.js';
import { ParticleSystem } from './entities/Particles.js';
import { Level } from './levels/Level.js';
import { createWorld1_1 } from './levels/world1_1.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.input = new InputManager();
    this.camera = new Camera();
    this.particles = new ParticleSystem();

    this.score = 0;
    this.coins = 0;
    this.lives = 3;
    this.time = 400;

    this.state = 'START'; // 'START', 'PLAYING', 'GAMEOVER', 'VICTORY'
    this.enemies = [];
    this.powerups = [];
    this.fireballs = [];

    this._bindMobileControls();
    this.resetLevel();

    this.loop = new GameLoop(this.update.bind(this), this.render.bind(this));
    this.loop.start();
  }

  resetLevel() {
    this.level = new Level(createWorld1_1());
    this.mario = new Mario(40, 180);
    this.enemies = [];
    this.powerups = [];
    this.fireballs = [];
    this.time = 400;

    // Spawn initial enemies
    this.level.initialEnemies.forEach((e) => {
      if (e.type === 'GOOMBA') {
        this.enemies.push(new Goomba(e.x, e.y));
      } else if (e.type === 'KOOPA') {
        this.enemies.push(new Koopa(e.x, e.y));
      }
    });

    this.camera.x = 0;
  }

  update(dt) {
    this.input.update();

    if (this.state === 'START') {
      if (this.input.isJumpJustPressed || this.input.isRunOrShoot) {
        sound.ensureContext();
        sound.startBGM();
        this.state = 'PLAYING';
      }
      return;
    }

    if (this.state === 'GAMEOVER' || this.state === 'VICTORY') {
      if (this.input.isJumpJustPressed) {
        this.lives = 3;
        this.score = 0;
        this.coins = 0;
        this.resetLevel();
        sound.startBGM();
        this.state = 'PLAYING';
      }
      return;
    }

    // Timer countdown
    this.time -= dt * 1.4;
    if (this.time <= 0 && !this.mario.isDead) {
      this.mario.die();
    }

    // Update Mario
    this.mario.update(
      dt,
      this.input,
      this.level,
      this.particles,
      (fb) => this.fireballs.push(fb)
    );

    // Update Camera
    this.camera.update(this.mario, this.level.width, dt);

    // Update Level bump blocks
    this.level.update(dt);

    // Update Particles
    this.particles.update(dt);

    // Update PowerUps
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const p = this.powerups[i];
      p.update(dt, this.level);
      if (Physics.checkAABB(this.mario.bounds, p.bounds) && !p.emerging) {
        if (p.type === 'MUSHROOM') {
          this.mario.growToSuper();
          this.score += 1000;
        } else if (p.type === 'FIRE_FLOWER') {
          this.mario.growToFire();
          this.score += 1000;
        } else if (p.type === 'STAR') {
          this.mario.activateStar();
          this.score += 1000;
        }
        this.particles.spawnScorePopup('1000', p.x, p.y);
        this.powerups.splice(i, 1);
      }
    }

    // Update Fireballs
    for (let i = this.fireballs.length - 1; i >= 0; i--) {
      const fb = this.fireballs[i];
      fb.update(dt, this.level);

      // Check vs enemies
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const en = this.enemies[j];
        if (!en.squished && Physics.checkAABB(fb.bounds, en.bounds)) {
          en.isDead = true;
          fb.isDead = true;
          this.score += 200;
          sound.playKick();
          this.particles.spawnScorePopup('200', en.x, en.y);
          break;
        }
      }

      if (fb.isDead) {
        this.fireballs.splice(i, 1);
      }
    }

    // Update Enemies & Collisions
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const en = this.enemies[i];

      // Active only when near camera
      if (this.camera.isVisible(en.x - 32, en.width + 64)) {
        en.update(dt, this.level);

        // Enemy vs Enemy (Shell kills other enemies)
        if (en instanceof Koopa && en.shellMoving) {
          this.enemies.forEach((other) => {
            if (other !== en && !other.squished && Physics.checkAABB(en.bounds, other.bounds)) {
              other.isDead = true;
              this.score += 500;
              sound.playKick();
              this.particles.spawnScorePopup('500', other.x, other.y);
            }
          });
        }

        // Mario vs Enemy
        if (!this.mario.isDead && Physics.checkAABB(this.mario.bounds, en.bounds)) {
          if (this.mario.isStarPowered) {
            // Star kills everything immediately
            en.isDead = true;
            this.score += 200;
            sound.playKick();
            this.particles.spawnScorePopup('200', en.x, en.y);
          } else if (this.mario.vy > 0 && this.mario.y + this.mario.height - en.y < 12) {
            // Stomp on top
            this.mario.bounceOnEnemy();
            if (en instanceof Goomba) {
              en.stomp();
              this.score += 100 * Math.pow(2, Math.min(this.mario.comboCounter - 1, 4));
              this.particles.spawnScorePopup('100', en.x, en.y);
            } else if (en instanceof Koopa) {
              en.stomp(this.mario);
            }
          } else {
            // Mario hurt
            if (en instanceof Koopa && en.inShell && !en.shellMoving) {
              // Kick motionless shell
              en.kick(this.mario.x < en.x ? 1 : -1);
            } else if (!en.squished) {
              this.mario.takeDamage();
            }
          }
        }
      }

      if (en.isDead) {
        this.enemies.splice(i, 1);
      }
    }

    // Check Flagpole Goal reached
    const flagTileX = 198 * CONFIG.TILES.SIZE;
    if (
      !this.mario.slidingFlag &&
      !this.mario.wonGame &&
      this.mario.x >= flagTileX - 4 &&
      this.mario.x <= flagTileX + 16
    ) {
      this.mario.slidingFlag = true;
      this.mario.vx = 0;
      this.mario.vy = 0;
      sound.stopBGM();
      sound.playFlagpole();
      this.score += Math.floor(this.time) * 50;
    }

    if (this.mario.wonGame) {
      this.state = 'VICTORY';
    }

    // Death / Respawn Check
    if (this.mario.isDead && this.mario.y > CONFIG.CANVAS.INTERNAL_HEIGHT + 60) {
      this.lives--;
      if (this.lives <= 0) {
        this.state = 'GAMEOVER';
      } else {
        this.resetLevel();
        sound.startBGM();
      }
    }
  }

  render() {
    this.renderer.clear();

    // Render Tilemap
    const startTileX = Math.max(0, Math.floor(this.camera.x / CONFIG.TILES.SIZE));
    const endTileX = Math.min(
      this.level.width - 1,
      Math.ceil((this.camera.x + this.camera.width) / CONFIG.TILES.SIZE)
    );

    for (let ty = 0; ty < this.level.height; ty++) {
      for (let tx = startTileX; tx <= endTileX; tx++) {
        const tile = this.level.getTile(tx, ty);
        if (tile !== CONFIG.TILES.EMPTY) {
          const bumpOffset = this.level.getBlockOffset(tx, ty);
          this.renderer.drawTile(tile, tx, ty, this.camera, bumpOffset);
        }
      }
    }

    // Render Powerups
    this.powerups.forEach((p) => this.renderer.drawPowerUp(p, this.camera));

    // Render Enemies
    this.enemies.forEach((e) => {
      if (e instanceof Goomba) this.renderer.drawGoomba(e, this.camera);
      if (e instanceof Koopa) this.renderer.drawKoopa(e, this.camera);
    });

    // Render Fireballs
    this.fireballs.forEach((fb) => this.renderer.drawFireball(fb, this.camera));

    // Render Mario
    this.renderer.drawMario(this.mario, this.camera);

    // Render Particles & Floaters
    this.particles.draw(this.renderer.ctx, this.camera);

    // Render Classic HUD
    this.renderer.drawHUD({
      score: this.score,
      coins: this.coins,
      world: '1-1',
      time: Math.max(0, this.time)
    });

    // Screen Overlays
    if (this.state === 'START') {
      this._drawStartOverlay();
    } else if (this.state === 'GAMEOVER') {
      this._drawGameOverOverlay();
    } else if (this.state === 'VICTORY') {
      this._drawVictoryOverlay();
    }
  }

  _drawStartOverlay() {
    const ctx = this.renderer.ctx;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = '#fcbc38';
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SUPER MARIO HTML5', this.canvas.width / 2, 70);

    ctx.fillStyle = '#ffffff';
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillText('STUDIO B2.st EDITION', this.canvas.width / 2, 90);

    ctx.fillStyle = '#00e8d8';
    ctx.fillText('PRESS JUMP TO PLAY', this.canvas.width / 2, 140);

    ctx.fillStyle = '#fce0a8';
    ctx.font = '6px "Press Start 2P", monospace';
    ctx.fillText('ARROWS: MOVE  SPACE: JUMP  SHIFT: RUN/FIRE', this.canvas.width / 2, 180);
    ctx.textAlign = 'left';
  }

  _drawGameOverOverlay() {
    const ctx = this.renderer.ctx;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = '#f83800';
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', this.canvas.width / 2, 110);

    ctx.fillStyle = '#ffffff';
    ctx.font = '7px "Press Start 2P", monospace';
    ctx.fillText('PRESS JUMP TO RESTART', this.canvas.width / 2, 140);
    ctx.textAlign = 'left';
  }

  _drawVictoryOverlay() {
    const ctx = this.renderer.ctx;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = '#fcbc38';
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('WORLD 1-1 CLEARED!', this.canvas.width / 2, 90);

    ctx.fillStyle = '#ffffff';
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillText(`TOTAL SCORE: ${this.score}`, this.canvas.width / 2, 120);

    ctx.fillStyle = '#00e8d8';
    ctx.font = '7px "Press Start 2P", monospace';
    ctx.fillText('PRESS JUMP TO PLAY AGAIN', this.canvas.width / 2, 150);
    ctx.textAlign = 'left';
  }

  _bindMobileControls() {
    const bind = (id, keyName) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('touchstart', (e) => {
        e.preventDefault();
        sound.ensureContext();
        this.input.touchState[keyName] = true;
        if (keyName === 'jump') this.input.touchState.jumpJustPressed = true;
        if (keyName === 'sprint') this.input.touchState.shootJustPressed = true;
      });
      el.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.input.touchState[keyName] = false;
        if (keyName === 'jump') this.input.touchState.jumpJustPressed = false;
        if (keyName === 'sprint') this.input.touchState.shootJustPressed = false;
      });
    };

    bind('btn-left', 'left');
    bind('btn-right', 'right');
    bind('btn-down', 'down');
    bind('btn-jump', 'jump');
    bind('btn-fire', 'sprint');

    const muteBtn = document.getElementById('btn-mute');
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        const isMuted = sound.toggleMute();
        muteBtn.innerText = isMuted ? '🔇' : '🔊';
      });
    }

    const crtBtn = document.getElementById('btn-crt');
    if (crtBtn) {
      crtBtn.addEventListener('click', () => {
        document.body.classList.toggle('crt-mode');
      });
    }
  }
}

// Auto-boot on load
window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  if (canvas) {
    window.gameInstance = new Game(canvas);
  }
});