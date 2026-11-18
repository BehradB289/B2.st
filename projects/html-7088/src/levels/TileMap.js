import { AABB } from '../engine/AABB.js';

export const TILE_TYPES = {
  EMPTY: 0,
  GROUND: 1,
  BRICK: 2,
  QUESTION: 3,
  PIPE: 4
};

export class TileMap {
  constructor(tileSize = 16) {
    this.tileSize = tileSize;
    this.tiles = new Map();
  }

  static key(tileX, tileY) {
    return `${tileX},${tileY}`;
  }

  setTile(tileX, tileY, type) {
    if (type === TILE_TYPES.EMPTY) {
      this.tiles.delete(TileMap.key(tileX, tileY));
    } else {
      this.tiles.set(TileMap.key(tileX, tileY), type);
    }
  }

  getTile(tileX, tileY) {
    return this.tiles.get(TileMap.key(tileX, tileY)) ?? TILE_TYPES.EMPTY;
  }

  getSolidTilesInAABB(aabb) {
    const minTileX = Math.floor(aabb.left / this.tileSize);
    const maxTileX = Math.floor(aabb.right / this.tileSize);
    const minTileY = Math.floor(aabb.top / this.tileSize);
    const maxTileY = Math.floor(aabb.bottom / this.tileSize);

    const result = [];
    for (let tx = minTileX; tx <= maxTileX; tx++) {
      for (let ty = minTileY; ty <= maxTileY; ty++) {
        const type = this.getTile(tx, ty);
        if (type !== TILE_TYPES.EMPTY) {
          result.push({
            tx,
            ty,
            type,
            aabb: new AABB(tx * this.tileSize, ty * this.tileSize, this.tileSize, this.tileSize)
          });
        }
      }
    }
    return result;
  }
}