import { GameConfig } from '../../config/game.config.js';

export const TILES = Object.freeze({
  AIR: 0,
  GROUND: 1,
  BRICK: 2,
  QUESTION_COIN: 3,
  QUESTION_MUSHROOM: 4,
  EMPTY_BLOCK: 5,
  PIPE_TL: 6,
  PIPE_TR: 7,
  PIPE_BL: 8,
  PIPE_BR: 9,
  FLAGPOLE: 10,
  FLAGPOLE_TOP: 11,
  CASTLE: 12
});

/**
 * Studio B2.st - TileMap Engine & Animated Tile Bumping
 */
export class TileMap {
  constructor(widthInTiles = 212, heightInTiles = 15) {
    this.width = widthInTiles;
    this.height = heightInTiles;
    this.tileSize = GameConfig.WORLD.TILE_SIZE;
    this.tiles = new Uint8Array(this.width * this.height);
    this.bumpingTiles = new Map(); // key "x,y" => { offset: float, velocity: float }
  }

  _getIndex(tx, ty) {
    if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height) {
      return -1;
    }
    return ty * this.width + tx;
  }

  getTile(tx, ty) {
    const idx = this._getIndex(tx, ty);
    return idx === -1 ? TILES.AIR : this.tiles[idx];
  }

  setTile(tx, ty, tileId) {
    const idx = this._getIndex(tx, ty);
    if (idx !== -1) {
      this.tiles[idx] = tileId;
    }
  }

  isSolid(tileId) {
    return [
      TILES.GROUND,
      TILES.BRICK,
      TILES.QUESTION_COIN,
      TILES.QUESTION_MUSHROOM,
      TILES.EMPTY_BLOCK,
      TILES.PIPE_TL,
      TILES.PIPE_TR,
      TILES.PIPE_BL,
      TILES.PIPE_BR,
      TILES.CASTLE
    ].includes(tileId);
  }

  isInteractive(tileId) {
    return [
      TILES.BRICK,
      TILES.QUESTION_COIN,
      TILES.QUESTION_MUSHROOM
    ].includes(tileId);
  }

  bumpTile(tx, ty) {
    const key = `${tx},${ty}`;
    if (!this.bumpingTiles.has(key)) {
      this.bumpingTiles.set(key, { offset: 0, velocity: -85 });
    }
  }

  update(dt) {
    for (const [key, bump] of this.bumpingTiles.entries()) {
      bump.velocity += 600 * dt;
      bump.offset += bump.velocity * dt;

      if (bump.offset >= 0) {
        this.bumpingTiles.delete(key);
      }
    }
  }

  getTileBumpOffset(tx, ty) {
    const bump = this.bumpingTiles.get(`${tx},${ty}`);
    return bump ? bump.offset : 0;
  }
}