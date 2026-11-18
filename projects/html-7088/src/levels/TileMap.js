/**
 * استودیو B2.st - لایه نقشه کاشی‌ها (Tilemap Engine)
 * مدیریت تایل‌های پایدار، جعبه‌های معما و رندر بهینه‌شده
 */
export const TILE_SIZE = 16;

export const TILE_TYPES = {
    EMPTY: 0,
    GROUND: 1,
    BRICK: 2,
    QUESTION_COIN: 3,
    QUESTION_MUSHROOM: 4,
    EMPTY_BLOCK: 5,
    PIPE_TOP_LEFT: 6,
    PIPE_TOP_RIGHT: 7,
    PIPE_BODY_LEFT: 8,
    PIPE_BODY_RIGHT: 9
};

export class TileMap {
    constructor(cols, rows) {
        this.cols = cols;
        this.rows = rows;
        this.grid = new Uint8Array(cols * rows);
    }

    setTile(col, row, type) {
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return;
        this.grid[row * this.cols + col] = type;
    }

    getTile(col, row) {
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return TILE_TYPES.EMPTY;
        return this.grid[row * this.cols + col];
    }

    isSolid(type) {
        return type !== TILE_TYPES.EMPTY;
    }

    getSolidTilesInRect(rect) {
        const solidTiles = [];
        const startCol = Math.floor(rect.pos.x / TILE_SIZE);
        const endCol = Math.floor((rect.pos.x + rect.size.x) / TILE_SIZE);
        const startRow = Math.floor(rect.pos.y / TILE_SIZE);
        const endRow = Math.floor((rect.pos.y + rect.size.y) / TILE_SIZE);

        for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
                const type = this.getTile(c, r);
                if (this.isSolid(type)) {
                    solidTiles.push({
                        col: c,
                        row: r,
                        x: c * TILE_SIZE,
                        y: r * TILE_SIZE,
                        w: TILE_SIZE,
                        h: TILE_SIZE,
                        type: type
                    });
                }
            }
        }
        return solidTiles;
    }

    render(ctx, camera) {
        const startCol = Math.max(0, Math.floor(camera.pos.x / TILE_SIZE));
        const endCol = Math.min(this.cols - 1, Math.ceil((camera.pos.x + camera.viewportWidth) / TILE_SIZE));

        for (let r = 0; r < this.rows; r++) {
            for (let c = startCol; c <= endCol; c++) {
                const type = this.getTile(c, r);
                if (type === TILE_TYPES.EMPTY) continue;
                this._renderTile(ctx, type, c * TILE_SIZE, r * TILE_SIZE);
            }
        }
    }

    _renderTile(ctx, type, x, y) {
        switch (type) {
            case TILE_TYPES.GROUND:
                ctx.fillStyle = '#D85800';
                ctx.fillRect(x, y, 16, 16);
                ctx.fillStyle = '#000000';
                ctx.fillRect(x, y, 16, 1);
                ctx.fillStyle = '#FCB488';
                ctx.fillRect(x + 1, y + 1, 2, 2);
                ctx.fillRect(x + 9, y + 9, 2, 2);
                break;
            case TILE_TYPES.BRICK:
                ctx.fillStyle = '#B84418';
                ctx.fillRect(x, y, 16, 16);
                ctx.fillStyle = '#000000';
                ctx.strokeRect(x + 0.5, y + 0.5, 15, 15);
                ctx.fillRect(x, y + 7, 16, 1);
                ctx.fillRect(x + 7, y, 1, 7);
                ctx.fillRect(x + 7, y + 8, 1, 8);
                break;
            case TILE_TYPES.QUESTION_COIN:
            case TILE_TYPES.QUESTION_MUSHROOM:
                ctx.fillStyle = '#FC9838';
                ctx.fillRect(x, y, 16, 16);
                ctx.fillStyle = '#000000';
                ctx.strokeRect(x + 0.5, y + 0.5, 15, 15);
                ctx.fillStyle = '#B84418';
                // علامت سوال پیکسلی
                ctx.fillRect(x + 5, y + 3, 6, 2);
                ctx.fillRect(x + 9, y + 5, 2, 3);
                ctx.fillRect(x + 6, y + 7, 4, 2);
                ctx.fillRect(x + 6, y + 11, 3, 2);
                break;
            case TILE_TYPES.EMPTY_BLOCK:
                ctx.fillStyle = '#8C5424';
                ctx.fillRect(x, y, 16, 16);
                ctx.fillStyle = '#000000';
                ctx.strokeRect(x + 0.5, y + 0.5, 15, 15);
                break;
            case TILE_TYPES.PIPE_TOP_LEFT:
                ctx.fillStyle = '#00A800';
                ctx.fillRect(x, y, 16, 16);
                ctx.fillStyle = '#A8E700';
                ctx.fillRect(x + 2, y, 3, 16);
                ctx.fillStyle = '#005000';
                ctx.fillRect(x, y, 1, 16);
                break;
            case TILE_TYPES.PIPE_TOP_RIGHT:
                ctx.fillStyle = '#00A800';
                ctx.fillRect(x, y, 16, 16);
                ctx.fillStyle = '#005000';
                ctx.fillRect(x + 13, y, 3, 16);
                break;
            case TILE_TYPES.PIPE_BODY_LEFT:
                ctx.fillStyle = '#00A800';
                ctx.fillRect(x + 2, y, 14, 16);
                ctx.fillStyle = '#A8E700';
                ctx.fillRect(x + 4, y, 3, 16);
                break;
            case TILE_TYPES.PIPE_BODY_RIGHT:
                ctx.fillStyle = '#00A800';
                ctx.fillRect(x, y, 14, 16);
                ctx.fillStyle = '#005000';
                ctx.fillRect(x + 11, y, 3, 16);
                break;
        }
    }
}