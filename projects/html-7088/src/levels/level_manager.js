/**
 * Tilemap Generator and Cached Chunk Level Renderer
 * Studio: B2.st
 */
import { GAME_CONFIG } from '../../config/game_config.js';
import { Goomba } from '../entities/goomba.js';
import { CollectibleCoin } from '../entities/collectible.js';

export class LevelManager {
    constructor(performanceCache) {
        this.cache = performanceCache;
        this.tileSize = GAME_CONFIG.WORLD.TILE_SIZE;
        this.chunkWidth = GAME_CONFIG.WORLD.CHUNK_WIDTH;
        this.mapWidth = 140; // Total tiles wide
        this.mapHeight = 15; // Total tiles high

        this.matrix = [];
        this.enemies = [];
        this.collectibles = [];

        this._generateWorld1_1();
    }

    _generateWorld1_1() {
        // Initialize empty matrix (0 = air)
        this.matrix = Array(this.mapHeight).fill(0).map(() => Array(this.mapWidth).fill(0));

        // Ground tiles (rows 13 & 14)
        for (let x = 0; x < this.mapWidth; x++) {
            // Pit gaps at x: 34-36 and x: 68-70
            if ((x >= 34 && x <= 36) || (x >= 68 && x <= 70)) continue;

            this.matrix[13][x] = 1; // Top soil
            this.matrix[14][x] = 2; // Deep rock
        }

        // Pipe 1 at x = 18
        this._buildPipe(18, 11, 2);
        // Pipe 2 at x = 28
        this._buildPipe(28, 10, 3);
        // Pipe 3 at x = 46
        this._buildPipe(46, 9, 4);

        // Blocks & Mystery Boxes
        this.matrix[9][12] = 3; // Question block
        this.matrix[9][14] = 4; // Brick block
        this.matrix[9][15] = 3; // Question
        this.matrix[9][16] = 4; // Brick
        this.matrix[5][15] = 3; // High Question

        // Pyramid stairs near end
        this._buildStairs(95, 12, 4);

        // Flagpole at x = 115
        for (let y = 3; y <= 12; y++) {
            this.matrix[y][115] = 5; // Flag pole
        }
        this.matrix[2][115] = 6; // Flag finial

        // Populate Enemies
        this.enemies.push(new Goomba(22 * this.tileSize, 12 * this.tileSize, this.cache));
        this.enemies.push(new Goomba(31 * this.tileSize, 12 * this.tileSize, this.cache));
        this.enemies.push(new Goomba(41 * this.tileSize, 12 * this.tileSize, this.cache));
        this.enemies.push(new Goomba(53 * this.tileSize, 12 * this.tileSize, this.cache));
        this.enemies.push(new Goomba(75 * this.tileSize, 12 * this.tileSize, this.cache));

        // Populate Collectibles
        this.collectibles.push(new CollectibleCoin(12 * this.tileSize + 2, 7 * this.tileSize, this.cache));
        this.collectibles.push(new CollectibleCoin(15 * this.tileSize + 2, 3 * this.tileSize, this.cache));
        this.collectibles.push(new CollectibleCoin(24 * this.tileSize, 12 * this.tileSize, this.cache));
        this.collectibles.push(new CollectibleCoin(25 * this.tileSize, 12 * this.tileSize, this.cache));
    }

    _buildPipe(x, topY, height) {
        for (let y = topY; y < topY + height; y++) {
            this.matrix[y][x] = (y === topY) ? 7 : 9;     // Left pipe
            this.matrix[y][x + 1] = (y === topY) ? 8 : 10; // Right pipe
        }
    }

    _buildStairs(startX, groundY, steps) {
        for (let i = 0; i < steps; i++) {
            const h = i + 1;
            const x = startX + i;
            for (let j = 0; j < h; j++) {
                this.matrix[groundY - j][x] = 4; // Brick stair
            }
        }
    }

    isSolidTile(x, y) {
        if (x < 0 || x >= this.mapWidth || y < 0 || y >= this.mapHeight) {
            return false;
        }
        const tile = this.matrix[y][x];
        // 0 = Air, 5 = Flag Pole (passable), 6 = Finial
        return tile > 0 && tile !== 5 && tile !== 6;
    }

    /**
     * Renders a single chunk (16x15 tiles) into an offscreen canvas and caches it.
     * Prevents re-rendering static tiles every frame.
     */
    _renderChunkToCache(chunkIndex) {
        const cacheKey = `chunk_${chunkIndex}`;
        const cached = this.cache.get(cacheKey);
        if (cached) return cached;

        const chunkPixelWidth = this.chunkWidth * this.tileSize;
        const chunkPixelHeight = this.mapHeight * this.tileSize;

        const canvas = document.createElement('canvas');
        canvas.width = chunkPixelWidth;
        canvas.height = chunkPixelHeight;
        const ctx = canvas.getContext('2d');

        const startTileX = chunkIndex * this.chunkWidth;
        const endTileX = Math.min(startTileX + this.chunkWidth, this.mapWidth);

        for (let ty = 0; ty < this.mapHeight; ty++) {
            for (let tx = startTileX; tx < endTileX; tx++) {
                const tile = this.matrix[ty][tx];
                if (tile === 0) continue;

                const px = (tx - startTileX) * this.tileSize;
                const py = ty * this.tileSize;

                this._drawTile(ctx, tile, px, py);
            }
        }

        // Cache the chunk surface
        this.cache.set(cacheKey, canvas, GAME_CONFIG.CACHE.CHUNK_CACHE_TTL_MS);
        return canvas;
    }

    _drawTile(ctx, tile, x, y) {
        const s = this.tileSize;
        switch (tile) {
            case 1: // Ground top
                ctx.fillStyle = '#c84c0c';
                ctx.fillRect(x, y, s, s);
                ctx.fillStyle = '#00a800';
                ctx.fillRect(x, y, s, 4);
                break;
            case 2: // Ground rock
                ctx.fillStyle = '#c84c0c';
                ctx.fillRect(x, y, s, s);
                ctx.fillStyle = '#000000';
                ctx.fillRect(x + 2, y + 2, 2, 2);
                ctx.fillRect(x + 10, y + 8, 2, 2);
                break;
            case 3: // Mystery Box
                ctx.fillStyle = '#fc9838';
                ctx.fillRect(x, y, s, s);
                ctx.fillStyle = '#000000';
                ctx.strokeRect(x + 0.5, y + 0.5, s - 1, s - 1);
                ctx.fillStyle = '#8c5000';
                ctx.fillText('?', x + 4, y + 12);
                break;
            case 4: // Brick
                ctx.fillStyle = '#b84418';
                ctx.fillRect(x, y, s, s);
                ctx.fillStyle = '#000000';
                ctx.fillRect(x, y + 7, s, 1);
                ctx.fillRect(x + 8, y, 1, 7);
                ctx.fillRect(x + 4, y + 8, 1, 8);
                break;
            case 5: // Flagpole
                ctx.fillStyle = '#00a800';
                ctx.fillRect(x + 7, y, 2, s);
                break;
            case 6: // Flag top ball
                ctx.fillStyle = '#fcb42c';
                ctx.fillRect(x + 5, y + 4, 6, 6);
                break;
            case 7: // Pipe top-left
            case 8: // Pipe top-right
            case 9: // Pipe shaft-left
            case 10: // Pipe shaft-right
                ctx.fillStyle = '#00a800';
                ctx.fillRect(x, y, s, s);
                ctx.fillStyle = '#80d010';
                ctx.fillRect(x + 2, y, 4, s);
                ctx.fillStyle = '#005000';
                ctx.fillRect(x + s - 3, y, 3, s);
                break;
        }
    }

    render(ctx, camera) {
        const chunkPixelWidth = this.chunkWidth * this.tileSize;

        const firstChunk = Math.max(0, Math.floor(camera.x / chunkPixelWidth));
        const lastChunk = Math.min(
            Math.ceil(this.mapWidth / this.chunkWidth) - 1,
            Math.floor((camera.x + camera.width) / chunkPixelWidth)
        );

        for (let c = firstChunk; c <= lastChunk; c++) {
            const chunkCanvas = this._renderChunkToCache(c);
            const chunkWorldX = c * chunkPixelWidth;
            ctx.drawImage(chunkCanvas, Math.round(chunkWorldX - camera.x), 0);
        }
    }
}