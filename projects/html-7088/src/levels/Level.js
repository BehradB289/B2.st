/**
 * Dynamic Tilemap Manager, Mystery Blocks, Bump Animations & Warp Logic
 */

import { CONFIG } from '../../config/game.config.js';
import { sound } from '../engine/Audio.js';
import { PowerUp } from '../entities/PowerUps.js';

export class Level {
  constructor(levelData) {
    this.width = levelData.width;
    this.height = levelData.height;
    this.tiles = [...levelData.tiles];
    this.bumpedBlocks = new Map(); // key: 'tx,ty' -> bump offset
    this.initialEnemies = levelData.enemies || [];
  }

  getTile(tx, ty) {
    if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height) {
      return CONFIG.TILES.EMPTY;
    }
    return this.tiles[ty * this.width + tx];
  }

  setTile(tx, ty, tileId) {
    if (tx >= 0 && tx < this.width && ty >= 0 && ty < this.height) {
      this.tiles[ty * this.width + tx] = tileId;
    }
  }

  isSolid(tx, ty) {
    const tile = this.getTile(tx, ty);
    return (
      tile === CONFIG.TILES.GROUND ||
      tile === CONFIG.TILES.BRICK ||
      tile === CONFIG.TILES.QUESTION_COIN ||
      tile === CONFIG.TILES.QUESTION_POWERUP ||
      tile === CONFIG.TILES.HARD_BLOCK ||
      tile === CONFIG.TILES.PIPE_TOP_LEFT ||
      tile === CONFIG.TILES.PIPE_TOP_RIGHT ||
      tile === CONFIG.TILES.PIPE_SHAFT_LEFT ||
      tile === CONFIG.TILES.PIPE_SHAFT_RIGHT ||
      tile === CONFIG.TILES.USED_BLOCK
    );
  }

  bumpBlock(tx, ty, mario, onSpawnItem, particleSystem) {
    const tile = this.getTile(tx, ty);

    if (tile === CONFIG.TILES.QUESTION_COIN) {
      this.setTile(tx, ty, CONFIG.TILES.USED_BLOCK);
      this._animateBump(tx, ty);
      sound.playCoin();
      particleSystem.spawnFloatingCoin(tx * CONFIG.TILES.SIZE + 4, ty * CONFIG.TILES.SIZE);
      particleSystem.spawnScorePopup('200', tx * CONFIG.TILES.SIZE, ty * CONFIG.TILES.SIZE - 12);
      return { score: 200, coins: 1 };
    }

    if (tile === CONFIG.TILES.QUESTION_POWERUP) {
      this.setTile(tx, ty, CONFIG.TILES.USED_BLOCK);
      this._animateBump(tx, ty);
      sound.playPowerUpAppears();

      const itemType = mario.powerState === 'SMALL' ? 'MUSHROOM' : 'FIRE_FLOWER';
      const item = new PowerUp(tx * CONFIG.TILES.SIZE, ty * CONFIG.TILES.SIZE, itemType);
      onSpawnItem(item);
      return { score: 1000, coins: 0 };
    }

    if (tile === CONFIG.TILES.BRICK) {
      if (mario.powerState === 'SMALL') {
        this._animateBump(tx, ty);
        sound.playBrickBump();
      } else {
        // Super/Fire Mario shatters the brick!
        this.setTile(tx, ty, CONFIG.TILES.EMPTY);
        sound.playBrickBreak();
        particleSystem.spawnBrickDebris(tx * CONFIG.TILES.SIZE + 4, ty * CONFIG.TILES.SIZE + 4);
        return { score: 50, coins: 0 };
      }
    }

    return null;
  }

  _animateBump(tx, ty) {
    const key = `${tx},${ty}`;
    this.bumpedBlocks.set(key, { offset: -6, timer: 0.12 });
  }

  update(dt) {
    // Smooth bump animation recovery
    this.bumpedBlocks.forEach((bump, key) => {
      bump.timer -= dt;
      if (bump.timer <= 0) {
        this.bumpedBlocks.delete(key);
      } else {
        bump.offset = Math.sin((bump.timer / 0.12) * Math.PI) * -7;
      }
    });
  }

  getBlockOffset(tx, ty) {
    const bump = this.bumpedBlocks.get(`${tx},${ty}`);
    return bump ? bump.offset : 0;
  }
}