/**
 * Game Orchestrator & System Coordinator
 * Studio: B2.st
 */

import { CANVAS, TILES } from '../../config/constants.js';
import { Camera } from './Camera.js';
import { InputHandler } from './InputHandler.js';
import { PhysicsEngine } from './PhysicsEngine.js';
import { GameLoop } from './GameLoop.js';
import { Mario } from '../entities/Mario.js';
import { createWorld1_1 } from '../levels/Level1.js';

export class GameEngine {
  constructor(canvasElement = null) {
    this.canvas = canvasElement;
    this.ctx = canvasElement && canvasElement.getContext ? canvasElement.getContext('2d') : null;
    this.camera = new Camera(CANVAS.INTERNAL_WIDTH, CANVAS.INTERNAL_HEIGHT);
    this.input = new InputHandler();
    this.timeRemaining = 400;
    this.timeCounter = 0;

    this.initLevel();
    this.physics = new PhysicsEngine(this.tileMap);

    this.loop = new GameLoop(
      (dt) => this.update(dt),
      () => this.render()
    );

    if (this.ctx) {
      this.input.bindDOM(window);
      this.ctx.imageSmoothingEnabled = false;
    }
  }

  initLevel() {
    const { map, entities } = createWorld1_1();
    this.tileMap = map;
    this.entities = entities;
    this.mario = new Mario(40, 160);
    this.entities.push(this.mario);
    this.camera.reset();
  }

  update(dt) {
    this.timeCounter += dt;
    if (this.timeCounter >= 1.0) {
      this.timeCounter = 0;
      this.timeRemaining = Math.max(0, this.timeRemaining - 1);
    }

    // Update Mario
    this.mario.update(dt, this.input);

    // Update other entities
    for (const entity of this.entities) {
      if (entity !== this.mario) {
        entity.update(dt);
      }
    }

    // Run physics updates
    for (const entity of this.entities) {
      this.physics.updateEntity(entity, dt);
    }

    // Inter-entity collisions
    this.physics.resolveEntityToEntity(this.mario, this.entities);

    // Cleanup dead/squashed entities
    this.entities = this.entities.filter((e) => !e.markedForRemoval);

    // Update camera track
    this.camera.update(this.mario.x);

    // Pit fall check
    if (this.mario.y > CANVAS.INTERNAL_HEIGHT + 32 && this.mario.isAlive) {
      this.mario.die();
    }
  }

  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;

    // NES Sky Blue
    ctx.fillStyle = '#5c94fc';
    ctx.fillRect(0, 0, CANVAS.INTERNAL_WIDTH, CANVAS.INTERNAL_HEIGHT);

    // Render Tiles in Viewport
    const startCol = Math.max(0, Math.floor(this.camera.x / TILES.SIZE));
    const endCol = Math.min(
      this.tileMap.cols - 1,
      Math.ceil((this.camera.x + this.camera.viewportWidth) / TILES.SIZE)
    );

    for (let r = 0; r < this.tileMap.rows; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const tile = this.tileMap.getTile(c, r);
        if (tile === TILES.EMPTY) continue;

        const sx = this.camera.worldToScreenX(c * TILES.SIZE);
        const sy = this.camera.worldToScreenY(r * TILES.SIZE);

        ctx.save();
        if (tile === TILES.GROUND) {
          ctx.fillStyle = '#b84418';
          ctx.fillRect(sx, sy, TILES.SIZE, TILES.SIZE);
          ctx.fillStyle = '#00a800';
          ctx.fillRect(sx, sy, TILES.SIZE, 2);
        } else if (tile === TILES.BRICK) {
          ctx.fillStyle = '#b84418';
          ctx.fillRect(sx, sy, TILES.SIZE, TILES.SIZE);
          ctx.strokeStyle = '#000000';
          ctx.strokeRect(sx + 0.5, sy + 0.5, TILES.SIZE - 1, TILES.SIZE - 1);
        } else if (tile === TILES.QUESTION_BLOCK) {
          ctx.fillStyle = '#fc9838';
          ctx.fillRect(sx, sy, TILES.SIZE, TILES.SIZE);
          ctx.fillStyle = '#000000';
          ctx.font = '10px monospace';
          ctx.fillText('?', sx + 4, sy + 12);
        } else if (tile === TILES.QUESTION_BLOCK_EMPTY) {
          ctx.fillStyle = '#887000';
          ctx.fillRect(sx, sy, TILES.SIZE, TILES.SIZE);
        } else if (tile >= TILES.PIPE_TOP_LEFT && tile <= TILES.PIPE_BODY_RIGHT) {
          ctx.fillStyle = '#00a800';
          ctx.fillRect(sx, sy, TILES.SIZE, TILES.SIZE);
          ctx.strokeStyle = '#005000';
          ctx.strokeRect(sx + 0.5, sy + 0.5, TILES.SIZE - 1, TILES.SIZE - 1);
        }
        ctx.restore();
      }
    }

    // Render all active Entities
    for (const entity of this.entities) {
      if (this.camera.isVisible(entity.getBounds())) {
        entity.render(ctx, this.camera);
      }
    }
  }

  start() {
    this.loop.start();
  }

  stop() {
    this.loop.stop();
  }
}