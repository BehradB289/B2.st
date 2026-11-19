/**
 * High-Performance TileMap with Offscreen Bitmap Caching
 * Studio: B2.st
 * Uses PerformanceCache to pre-render tile chunks and textures.
 */

import { GameConfig } from '../../config/game.config.js';
import { globalSpriteCache } from '../core/performance_cache.js';

export const TileType = {
    AIR: 0,
    GROUND: 1,
    BRICK: 2,
    QUESTION: 3,
    QUESTION_EMPTY: 4,
    PIPE_TOP_LEFT: 5,
    PIPE_TOP_RIGHT: 6,
    PIPE_BODY_LEFT: 7,
    PIPE_BODY_RIGHT: 8,
    BLOCK_HARD: 9,
    FLAG_POLE: 10
};

export class TileMap {
    constructor(cols, rows, tileSize = GameConfig.tiles.size) {
        this.cols = cols;
        this.rows = rows;
        this.tileSize = tileSize;
        this.width = cols * tileSize;
        this.height = rows * tileSize;
        
        // 1D flat typed array for optimal memory locality
        this.grid = new Uint8Array(cols * rows);
        this.blockMetadata = new Map(); // Store coin contents, animations
    }

    setTile(col, row, type) {
        if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
            this.grid[row * this.cols + col] = type;
        }
    }

    getTile(col, row) {
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
            return TileType.AIR;
        }
        return this.grid[row * this.cols + col];
    }

    /**
     * Query all solid collidable tiles within an AABB bounding rectangle
     * @param {number} x 
     * @param {number} y 
     * @param {number} w 
     * @param {number} h 
     * @returns {Array<Object>}
     */
    getCollidableTilesInRegion(x, y, w, h) {
        const startCol = Math.max(0, Math.floor(x / this.tileSize));
        const endCol = Math.min(this.cols - 1, Math.floor((x + w) / this.tileSize));
        const startRow = Math.max(0, Math.floor(y / this.tileSize));
        const endRow = Math.min(this.rows - 1, Math.floor((y + h) / this.tileSize));

        const collidables = [];

        for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
                const type = this.grid[r * this.cols + c];
                if (type !== TileType.AIR && type !== TileType.FLAG_POLE) {
                    collidables.push({
                        x: c * this.tileSize,
                        y: r * this.tileSize,
                        width: this.tileSize,
                        height: this.tileSize,
                        type,
                        col: c,
                        row: r
                    });
                }
            }
        }
        return collidables;
    }

    /**
     * Render tiles efficiently using pre-rendered procedural sprites from PerformanceCache
     */
    render(ctx, camera) {
        const startCol = Math.max(0, Math.floor(camera.x / this.tileSize));
        const endCol = Math.min(this.cols - 1, Math.ceil((camera.x + camera.viewWidth) / this.tileSize));
        const startRow = 0;
        const endRow = this.rows - 1;

        for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
                const type = this.grid[r * this.cols + c];
                if (type === TileType.AIR) continue;

                const worldX = c * this.tileSize;
                const worldY = r * this.tileSize;
                const screenX = Math.floor(worldX - camera.x);
                const screenY = Math.floor(worldY - camera.y);

                // Fetch pre-rendered tile bitmap from Cache (O(1))
                const tileBitmap = this._getCachedTileSprite(type);
                if (tileBitmap) {
                    ctx.drawImage(tileBitmap, screenX, screenY);
                }
            }
        }
    }

    /**
     * Get or synthesize tile graphic using In-Memory Cache
     * @private
     */
    _getCachedTileSprite(type) {
        const cacheKey = `tile_sprite_${type}`;
        return globalSpriteCache.getOrRenderCanvas(cacheKey, this.tileSize, this.tileSize, (offCtx) => {
            const s = this.tileSize;

            switch (type) {
                case TileType.GROUND:
                    // Ground top brown/orange pattern
                    offCtx.fillStyle = '#d88b28';
                    offCtx.fillRect(0, 0, s, s);
                    offCtx.fillStyle = '#000000';
                    offCtx.fillRect(0, 0, s, 1);
                    offCtx.fillStyle = '#fcb474';
                    offCtx.fillRect(1, 1, s - 2, 2);
                    offCtx.fillStyle = '#5c3c14';
                    offCtx.fillRect(2, 6, 4, 3);
                    offCtx.fillRect(9, 10, 5, 3);
                    break;

                case TileType.BRICK:
                    offCtx.fillStyle = '#b84418';
                    offCtx.fillRect(0, 0, s, s);
                    offCtx.fillStyle = '#000000';
                    // Brick mortar lines
                    offCtx.fillRect(0, 0, s, 1);
                    offCtx.fillRect(0, 7, s, 1);
                    offCtx.fillRect(0, 15, s, 1);
                    offCtx.fillRect(7, 0, 1, 7);
                    offCtx.fillRect(3, 8, 1, 7);
                    offCtx.fillRect(11, 8, 1, 7);
                    offCtx.fillStyle = '#fc9878';
                    offCtx.fillRect(1, 1, 5, 1);
                    offCtx.fillRect(8, 1, 7, 1);
                    break;

                case TileType.QUESTION:
                    offCtx.fillStyle = '#fc9838';
                    offCtx.fillRect(0, 0, s, s);
                    offCtx.fillStyle = '#000000';
                    offCtx.strokeRect(0.5, 0.5, s - 1, s - 1);
                    // Question mark '?' glyph
                    offCtx.fillStyle = '#803400';
                    offCtx.fillRect(5, 3, 6, 2);
                    offCtx.fillRect(9, 5, 2, 3);
                    offCtx.fillRect(6, 7, 4, 2);
                    offCtx.fillRect(6, 9, 2, 2);
                    offCtx.fillRect(6, 12, 2, 2);
                    break;

                case TileType.QUESTION_EMPTY:
                    offCtx.fillStyle = '#8c5828';
                    offCtx.fillRect(0, 0, s, s);
                    offCtx.fillStyle = '#000000';
                    offCtx.strokeRect(0.5, 0.5, s - 1, s - 1);
                    break;

                case TileType.PIPE_TOP_LEFT:
                    offCtx.fillStyle = '#00a800';
                    offCtx.fillRect(0, 0, s, s);
                    offCtx.fillStyle = '#80d010';
                    offCtx.fillRect(1, 1, 3, s - 1);
                    offCtx.fillStyle = '#005000';
                    offCtx.fillRect(s - 2, 0, 2, s);
                    break;

                case TileType.PIPE_TOP_RIGHT:
                    offCtx.fillStyle = '#00a800';
                    offCtx.fillRect(0, 0, s, s);
                    offCtx.fillStyle = '#80d010';
                    offCtx.fillRect(2, 1, 3, s - 1);
                    offCtx.fillStyle = '#005000';
                    offCtx.fillRect(s - 3, 0, 3, s);
                    break;

                case TileType.PIPE_BODY_LEFT:
                    offCtx.fillStyle = '#00a800';
                    offCtx.fillRect(2, 0, s - 2, s);
                    offCtx.fillStyle = '#80d010';
                    offCtx.fillRect(3, 0, 3, s);
                    offCtx.fillStyle = '#005000';
                    offCtx.fillRect(s - 2, 0, 2, s);
                    break;

                case TileType.PIPE_BODY_RIGHT:
                    offCtx.fillStyle = '#00a800';
                    offCtx.fillRect(0, 0, s - 2, s);
                    offCtx.fillStyle = '#80d010';
                    offCtx.fillRect(2, 0, 3, s);
                    offCtx.fillStyle = '#005000';
                    offCtx.fillRect(s - 4, 0, 2, s);
                    break;

                case TileType.BLOCK_HARD:
                    offCtx.fillStyle = '#6888fc';
                    offCtx.fillRect(0, 0, s, s);
                    offCtx.fillStyle = '#000000';
                    offCtx.strokeRect(0.5, 0.5, s - 1, s - 1);
                    break;
            }
        });
    }
}