import { GameConfig } from '../config/game.config.js';
import { Camera } from './engine/Camera.js';
import { InputManager } from './engine/Input.js';
import { SoundSynthesizer } from './engine/Audio.js';
import { PhysicsEngine } from './engine/Physics.js';
import { GameLoop } from './engine/GameLoop.js';
import { TileMap, TILES } from './levels/TileMap.js';
import { LevelLoader } from './levels/Level1_1.js';
import { SpriteRenderer } from './entities/SpriteRenderer.js';
import { Mario, MARIO_STATE } from './entities/Mario.js';
import { Goomba, Koopa } from './entities/Enemies.js';
import { SuperMushroomItem, BouncingCoinParticle, BrickDebrisParticle, FloatingText } from './entities/Items.js';

/**
 * Studio B2.st - Master Mario Canvas Engine
 */
class MarioGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;

    this.tileMap = new TileMap(212, 15);
    this.camera = new Camera();
    this.input = new InputManager();
    this.audio = new SoundSynthesizer();
    this.physics = new PhysicsEngine(this.tileMap);

    this.entities = [];
    this.particles = [];
    this.mario = null;
    this.timeRemaining = GameConfig.WORLD.TIME_LIMIT;
    this.isPaused = false;
    this.isGameOver = false;
    this.levelData = null;

    this.init();
  }

  init() {
    this.input.init();
    this.camera.setLevelWidth(this.tileMap.width);
    this.loop = new GameLoop(this.update.bind(this), this.render.bind(this));

    this.resetLevel();
    this.loop.start();
  }

  resetLevel() {
    this.tileMap = new TileMap(212, 15);
    this.physics.tileMap = this.tileMap;
    this.levelData = LevelLoader.loadWorld1_1(this.tileMap);
    this.camera.reset();

    const spawn = this.levelData.marioSpawn;
    this.mario = new Mario(spawn.x, spawn.y);

    this.mario.onHitCeilingBlock = (tx, ty, tileId) => {
      this.handleBlockBump(tx, ty, tileId);
    };

    // Instantiate enemies
    this.entities = [];
    this.levelData.enemySpawns.forEach(item => {
      if (item.type === 'goomba') {
        this.entities.push(new Goomba(item.x, item.y));
      } else if (item.type === 'koopa') {
        this.entities.push(new Koopa(item.x, item.y));
      }
    });

    this.particles = [];
    this.timeRemaining = GameConfig.WORLD.TIME_LIMIT;
    this.isGameOver = false;
  }

  handleBlockBump(tx, ty, tileId) {
    this.tileMap.bumpTile(tx, ty);

    if (tileId === TILES.QUESTION_COIN) {
      this.tileMap.setTile(tx, ty, TILES.EMPTY_BLOCK);
      this.mario.score += 200;
      this.mario.coins += 1;
      this.particles.push(new BouncingCoinParticle(tx * 16, (ty - 1) * 16));
      this.particles.push(new FloatingText(tx * 16 + 2, (ty - 1) * 16, '200'));
      this.audio.playCoin();
    } else if (tileId === TILES.QUESTION_MUSHROOM) {
      this.tileMap.setTile(tx, ty, TILES.EMPTY_BLOCK);
      this.entities.push(new SuperMushroomItem(tx * 16, ty * 16));
      this.audio.playPowerup();
    } else if (tileId === TILES.BRICK) {
      if (this.mario.isSuper) {
        // Destroy brick into debris
        this.tileMap.setTile(tx, ty, TILES.AIR);
        const bx = tx * 16;
        const by = ty * 16;
        this.particles.push(new BrickDebrisParticle(bx, by, -60, -220));
        this.particles.push(new BrickDebrisParticle(bx + 8, by, 60, -220));
        this.particles.push(new BrickDebrisParticle(bx, by + 8, -50, -140));
        this.particles.push(new BrickDebrisParticle(bx + 8, by + 8, 50, -140));
        this.audio.playBump();
      } else {
        this.audio.playBump();
      }
    }
  }

  update(dt) {
    if (this.input.isPauseJustPressed) {
      this.isPaused = !this.isPaused;
      if (this.isPaused) {
        this.audio.stopBGM();
      } else {
        this.audio.startBGM();
      }
    }

    if (this.isPaused) {
      this.input.update();
      return;
    }

    // Time limit countdown
    if (this.mario.state !== MARIO_STATE.DYING && this.mario.state !== MARIO_STATE.VICTORY) {
      this.timeRemaining -= dt * 1.5;
      if (this.timeRemaining <= 0) {
        this.timeRemaining = 0;
        this.mario.kill(this.audio);
      }
    }

    this.tileMap.update(dt);
    this.mario.handleInput(this.input, dt, this.audio);
    this.mario.update(dt, this.physics, this.camera);
    this.camera.update(this.mario.position.x);

    // Check flagpole contact
    if (this.mario.state !== MARIO_STATE.FLAGPOLE && this.mario.state !== MARIO_STATE.VICTORY) {
      if (this.mario.position.x >= this.levelData.flagpoleX - 6) {
        this.mario.state = MARIO_STATE.FLAGPOLE;
        this.audio.stopBGM();
        this.audio.playStageClear();
        this.mario.score += Math.floor(this.timeRemaining) * 50;
      }
    }

    // Update items & enemies
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const e = this.entities[i];
      if (this.camera.isVisible(e.getHitbox())) {
        e.update(dt, this.physics);
      }

      if (e.shouldRemove) {
        this.entities.splice(i, 1);
        continue;
      }

      // Check collision with Mario
      if (this.mario.state !== MARIO_STATE.DYING && this.mario.invulnerableTimer <= 0) {
        const mBox = this.mario.getHitbox();
        const eBox = e.getHitbox();

        if (mBox.intersects(eBox)) {
          if (e instanceof SuperMushroomItem) {
            this.mario.growSuper();
            this.mario.score += 1000;
            this.particles.push(new FloatingText(e.position.x, e.position.y, '1000'));
            this.audio.playPowerup();
            e.shouldRemove = true;
          } else if (e instanceof Goomba && !e.isSquished) {
            if (this.mario.velocity.y > 0 && mBox.bottom - eBox.top < 10) {
              // Stomped on Goomba
              e.stomp();
              this.mario.velocity.y = GameConfig.MARIO.BOUNCE_IMPULSE;
              this.mario.score += 100;
              this.particles.push(new FloatingText(e.position.x, e.position.y, '100'));
              this.audio.playStomp();
            } else {
              // Mario hit by Goomba
              if (this.mario.isSuper) {
                this.mario.shrinkSmall();
                this.audio.playBump();
              } else {
                this.mario.kill(this.audio);
              }
            }
          } else if (e instanceof Koopa) {
            if (e.isShell) {
              if (!e.isMovingShell) {
                const dir = this.mario.position.x < e.position.x ? 1 : -1;
                e.kick(dir);
                this.audio.playStomp();
              } else {
                if (this.mario.velocity.y > 0 && mBox.bottom - eBox.top < 10) {
                  e.isMovingShell = false;
                  this.mario.velocity.y = GameConfig.MARIO.BOUNCE_IMPULSE;
                  this.audio.playStomp();
                } else if (this.mario.isSuper) {
                  this.mario.shrinkSmall();
                } else {
                  this.mario.kill(this.audio);
                }
              }
            } else if (this.mario.velocity.y > 0 && mBox.bottom - eBox.top < 10) {
              e.stomp();
              this.mario.velocity.y = GameConfig.MARIO.BOUNCE_IMPULSE;
              this.audio.playStomp();
            } else if (this.mario.isSuper) {
              this.mario.shrinkSmall();
            } else {
              this.mario.kill(this.audio);
            }
          }
        }
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update(dt);
      if (p.shouldRemove) {
        this.particles.splice(i, 1);
      }
    }

    // Check Mario death respawn
    if (this.mario.state === MARIO_STATE.DYING && this.mario.dyingTimer > 2.5) {
      if (this.mario.lives > 0) {
        this.resetLevel();
      } else {
        this.isGameOver = true;
      }
    }

    this.input.update();
  }

  render() {
    const ctx = this.ctx;
    ctx.fillStyle = GameConfig.PALETTE.SKY_BLUE;
    ctx.fillRect(0, 0, GameConfig.CANVAS.INTERNAL_WIDTH, GameConfig.CANVAS.INTERNAL_HEIGHT);

    // Draw visible tiles
    const startTx = Math.max(0, Math.floor(this.camera.x / 16));
    const endTx = Math.min(this.tileMap.width - 1, Math.ceil((this.camera.x + GameConfig.CANVAS.INTERNAL_WIDTH) / 16));

    for (let ty = 0; ty < this.tileMap.height; ty++) {
      for (let tx = startTx; tx <= endTx; tx++) {
        const tileId = this.tileMap.getTile(tx, ty);
        if (tileId !== TILES.AIR) {
          const bumpOffset = this.tileMap.getTileBumpOffset(tx, ty);
          const screen = this.camera.worldToScreen(tx * 16, ty * 16 + bumpOffset);
          SpriteRenderer.drawTile(ctx, tileId, screen.x, screen.y, performance.now() * 0.001);
        }
      }
    }

    // Render entities
    this.entities.forEach(e => {
      if (this.camera.isVisible(e.getHitbox())) {
        e.render(ctx, this.camera);
      }
    });

    // Render Mario
    this.mario.render(ctx, this.camera);

    // Render particles
    this.particles.forEach(p => p.render(ctx, this.camera));

    // Render NES HUD
    this.renderHUD();

    // Render Pause or Game Over overlay
    if (this.isPaused) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(0, 0, GameConfig.CANVAS.INTERNAL_WIDTH, GameConfig.CANVAS.INTERNAL_HEIGHT);
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', GameConfig.CANVAS.INTERNAL_WIDTH / 2, GameConfig.CANVAS.INTERNAL_HEIGHT / 2);
    } else if (this.isGameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, GameConfig.CANVAS.INTERNAL_WIDTH, GameConfig.CANVAS.INTERNAL_HEIGHT);
      ctx.fillStyle = '#ff2222';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', GameConfig.CANVAS.INTERNAL_WIDTH / 2, GameConfig.CANVAS.INTERNAL_HEIGHT / 2);
    }
  }

  renderHUD() {
    const ctx = this.ctx;
    ctx.font = '8px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';

    // Headers
    ctx.fillText('MARIO', 16, 12);
    ctx.fillText('WORLD', 140, 12);
    ctx.fillText('TIME', 205, 12);

    // Values
    const scoreStr = String(this.mario.score).padStart(6, '0');
    const coinsStr = `o×${String(this.mario.coins).padStart(2, '0')}`;
    const timeStr = String(Math.ceil(this.timeRemaining)).padStart(3, '0');

    ctx.fillText(scoreStr, 16, 22);
    ctx.fillText(coinsStr, 90, 22);
    ctx.fillText('1-1', 148, 22);
    ctx.fillText(timeStr, 209, 22);
  }
}

// Bootstrap on window load
window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');
  if (canvas) {
    window.gameEngine = new MarioGame(canvas);
  }
});