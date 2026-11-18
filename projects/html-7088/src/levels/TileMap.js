/**
 * 2D TileMap Representation and Layer Manager
 * Studio: B2.st
 */

import { TILES } from '../../config/constants.js';

export class TileMap {
  constructor(tileSize = TILES.SIZE, cols = 220, rows = 15) {
    this.tileSize = tileSize;
    this.cols = cols;
    this.rows = rows;
    this.grid = new Array(rows).fill(null).map(() => new Array(cols).fill(TILES.EMPTY));
    this.events = [];
  }

  setTile(col, row, type) {
    if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
      this.grid[row][col] = type;
    }
  }

  getTile(col, row) {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
      return TILES.EMPTY;
    }
    return this.grid[row][col];
  }

  isSolid(col, row) {
    const tile = this.getTile(col, row);
    return (
      tile === TILES.GROUND ||
      tile === TILES.BRICK ||
      tile === TILES.QUESTION_BLOCK ||
      tile === TILES.QUESTION_BLOCK_EMPTY ||
      tile === TILES.PIPE_TOP_LEFT ||
      tile === TILES.PIPE_TOP_RIGHT ||
      tile === TILES.PIPE_BODY_LEFT ||
      tile === TILES.PIPE_BODY_RIGHT ||
      tile === TILES.HARD_BLOCK
    );
  }

  interactTile(col, row, interactor) {
    const tile = this.getTile(col, row);
    if (tile === TILES.QUESTION_BLOCK) {
      this.setTile(col, row, TILES.QUESTION_BLOCK_EMPTY);
      if (interactor && typeof interactor.collectCoin === 'function') {
        interactor.collectCoin();
      }
      return { type: 'QUESTION_BLOCK_HIT', col, row, spawned: 'COIN' };
    }
    if (tile === TILES.BRICK) {
      if (interactor && interactor.isBig) {
        this.setTile(col, row, TILES.EMPTY);
        return { type: 'BRICK_BROKEN', col, row };
      }
      return { type: 'BRICK_BUMPED', col, row };
    }
    return null;
  }
}