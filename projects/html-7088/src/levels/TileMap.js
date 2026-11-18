/**
 * @file TileMap.js
 * @description Level tilemap engine with In-Memory cached bitmap rendering for 60FPS NES performance.
 */
export const TileType = {
  EMPTY: 0,
  GROUND: 1,
  BRICK: 2,
  QUESTION: 3,
  PIPE_TL: 4,
  PIPE_TR: 5,
  PIPE_BL: 6,
  PIPE_BR: 7,
  BLOCK: 8,
};

export class TileMap {
  /**
   * @param {number} tileSize
   * @param {number[][]} grid
   * @param {PerformanceCache} cache
   */
  constructor(tileSize, grid, cache) {
    this.tileSize = tileSize;
    this.grid = grid;
    this.cache = cache;
    this.rows = grid.length;
    this.cols = grid[0].length;
    this.width = this.cols * tileSize;
    this.height = this.rows * tileSize;

    // Interactive tiles state
    this.dynamicTiles = new Map();
  }

  getTile(col, row) {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
      return TileType.EMPTY;
    }
    return this.grid[row][col];
  }

  /**
   * Get all solid tiles overlapping the search bounding box.
   */
  getSurroundingSolids(rect) {
    const solids = [];
    const minCol = Math.max(0, Math.floor(rect.x / this.tileSize));
    const maxCol = Math.min(this.cols - 1, Math.floor((rect.x + rect.width) / this.tileSize));
    const minRow = Math.max(0, Math.floor(rect.y / this.tileSize));
    const maxRow = Math.min(this.rows - 1, Math.floor((rect.y + rect.height) / this.tileSize));

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const typeId = this.grid[r][c];
        if (typeId !== TileType.EMPTY) {
          const key = `${c},${r}`;
          let dynamicState = this.dynamicTiles.get(key);

          if (!dynamicState) {
            dynamicState = {
              col: c,
              row: r,
              x: c * this.tileSize,
              y: r * this.tileSize,
              width: this.tileSize,
              height: this.tileSize,
              type: typeId === TileType.QUESTION ? 'question' : (typeId === TileType.BRICK ? 'brick' : 'solid'),
              triggered: false,
            };
            this.dynamicTiles.set(key, dynamicState);
          }

          solids.push(dynamicState);
        }
      }
    }
    return solids;
  }

  /**
   * Render visible tiles using pre-rendered cached bitmaps.
   */
  render(ctx, camera) {
    const startCol = Math.max(0, Math.floor(camera.position.x / this.tileSize));
    const endCol = Math.min(this.cols - 1, Math.ceil((camera.position.x + camera.viewportWidth) / this.tileSize));

    for (let r = 0; r < this.rows; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const tileId = this.grid[r][c];
        if (tileId === TileType.EMPTY) continue;

        const tileX = Math.round(c * this.tileSize - camera.position.x);
        const tileY = Math.round(r * this.tileSize - camera.position.y);

        const dynKey = `${c},${r}`;
        const dyn = this.dynamicTiles.get(dynKey);
        const isTriggeredQuestion = dyn && dyn.triggered;

        // Render via cache
        const cacheKey = `tile_${tileId}_${isTriggeredQuestion ? 'spent' : 'normal'}`;
        let cachedTile = this.cache.get(cacheKey);

        if (!cachedTile) {
          cachedTile = document.createElement('canvas');
          cachedTile.width = this.tileSize;
          cachedTile.height = this.tileSize;
          const tctx = cachedTile.getContext('2d');
          this._drawProceduralTile(tctx, tileId, isTriggeredQuestion);
          this.cache.set(cacheKey, cachedTile, 600000); // 10 min TTL
        }

        ctx.drawImage(cachedTile, tileX, tileY);
      }
    }
  }

  _drawProceduralTile(ctx, typeId, isTriggered) {
    const S = this.tileSize;

    switch (typeId) {
      case TileType.GROUND: {
        // NES Ground Brick Pattern
        ctx.fillStyle = '#D86B10';
        ctx.fillRect(0, 0, S, S);
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, S, 1);
        ctx.fillRect(0, S - 1, S, 1);
        ctx.fillRect(0, 0, 1, S);
        ctx.fillStyle = '#FFA044';
        ctx.fillRect(1, 1, 3, 3);
        ctx.fillRect(9, 7, 3, 3);
        break;
      }

      case TileType.BRICK: {
        ctx.fillStyle = '#B84418';
        ctx.fillRect(0, 0, S, S);
        ctx.fillStyle = '#000000';
        // Mortar lines
        ctx.fillRect(0, S / 2 - 1, S, 1);
        ctx.fillRect(S / 2 - 1, 0, 1, S / 2);
        ctx.fillRect(0, S - 1, S, 1);
        break;
      }

      case TileType.QUESTION: {
        if (isTriggered) {
          ctx.fillStyle = '#8B6A47';
          ctx.fillRect(0, 0, S, S);
          ctx.fillStyle = '#000000';
          ctx.strokeRect(1, 1, S - 2, S - 2);
        } else {
          ctx.fillStyle = '#FC9838';
          ctx.fillRect(0, 0, S, S);
          ctx.fillStyle = '#000000';
          ctx.strokeRect(0, 0, S, S);
          // Question mark symbol
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(5, 3, 6, 2);
          ctx.fillRect(9, 5, 2, 3);
          ctx.fillRect(6, 7, 4, 2);
          ctx.fillRect(6, 11, 2, 2);
        }
        break;
      }

      case TileType.PIPE_TL:
      case TileType.PIPE_TR:
      case TileType.PIPE_BL:
      case TileType.PIPE_BR: {
        ctx.fillStyle = '#00A800';
        ctx.fillRect(0, 0, S, S);
        ctx.fillStyle = '#80D010';
        ctx.fillRect(2, 0, 3, S);
        ctx.fillStyle = '#005000';
        ctx.fillRect(S - 3, 0, 3, S);
        ctx.fillStyle = '#000000';
        ctx.strokeRect(0, 0, S, S);
        break;
      }

      case TileType.BLOCK: {
        ctx.fillStyle = '#808080';
        ctx.fillRect(0, 0, S, S);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(1, 1, S - 2, 1);
        ctx.fillRect(1, 1, 1, S - 2);
        ctx.fillStyle = '#303030';
        ctx.fillRect(1, S - 2, S - 2, 1);
        ctx.fillRect(S - 2, 1, 1, S - 2);
        break;
      }
    }
  }
}