import { GAME_CONFIG } from '../../config/game.config.js';

/**
 * Grid-based TileMap Level Representation
 */
export class TileMap {
  constructor(cols = 100, rows = 15, tileSize = GAME_CONFIG.TILE_SIZE) {
    this.cols = cols;
    this.rows = rows;
    this.tileSize = tileSize;
    this.tiles = new Uint8Array(cols * rows);
    this.blockData = new Map(); // coordinates -> state data
  }

  getIndex(col, row) {
    return row * this.cols + col;
  }

  setTile(col, row, type, meta = null) {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return;
    this.tiles[this.getIndex(col, row)] = type;
    if (meta) {
      this.blockData.set(`${col},${row}`, { ...meta });
    }
  }

  getTile(col, row) {
    if (col < 0 || col >= this.cols || row >= this.rows) {
      return GAME_CONFIG.TILE_TYPE.GROUND; // Solid world border
    }
    if (row < 0) {
      return GAME_CONFIG.TILE_TYPE.AIR; // Air above ceiling
    }
    return this.tiles[this.getIndex(col, row)];
  }

  isSolid(type) {
    return type !== GAME_CONFIG.TILE_TYPE.AIR;
  }

  getSolidTilesInAABB(aabb) {
    const solidTiles = [];

    const startCol = Math.max(0, Math.floor(aabb.left / this.tileSize));
    const endCol = Math.min(this.cols - 1, Math.floor((aabb.right - 0.001) / this.tileSize));
    const startRow = Math.max(0, Math.floor(aabb.top / this.tileSize));
    const endRow = Math.min(this.rows - 1, Math.floor((aabb.bottom - 0.001) / this.tileSize));

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const type = this.getTile(c, r);
        if (this.isSolid(type)) {
          solidTiles.push({
            col: c,
            row: r,
            type,
            x: c * this.tileSize,
            y: r * this.tileSize,
            width: this.tileSize,
            height: this.tileSize
          });
        }
      }
    }
    return solidTiles;
  }

  hitBlockAt(col, row, player) {
    const type = this.getTile(col, row);

    if (type === GAME_CONFIG.TILE_TYPE.QUESTION_BLOCK) {
      // Turns into Empty Block & gives coin
      this.setTile(col, row, GAME_CONFIG.TILE_TYPE.EMPTY_BLOCK);
      player?.collectCoin();
      return { triggered: true, type: 'QUESTION_BLOCK_OPENED' };
    }

    if (type === GAME_CONFIG.TILE_TYPE.BRICK) {
      if (player?.state === GAME_CONFIG.MARIO_STATE.SUPER) {
        this.setTile(col, row, GAME_CONFIG.TILE_TYPE.AIR);
        player.score += GAME_CONFIG.SCORES.BREAK_BRICK;
        return { triggered: true, type: 'BRICK_BROKEN' };
      }
      return { triggered: true, type: 'BRICK_BUMPED' };
    }

    return { triggered: false };
  }
}