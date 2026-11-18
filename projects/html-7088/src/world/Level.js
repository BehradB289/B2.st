/**
 * موتور تایل‌مپ و محاسبات ژئومتری و کلیدهای برخورد
 */
'use strict';

export const TILE_SIZE = 32;

export const TileType = {
    AIR: 0,
    GROUND: 1,
    BRICK: 2,
    QUESTION: 3,
    QUESTION_EMPTY: 4,
    PIPE_TL: 5,
    PIPE_TR: 6,
    PIPE_BL: 7,
    PIPE_BR: 8,
    FLAG_POLE: 9
};

export class Level {
    constructor() {
        this.width = 160; // طول مرحله به تعداد تایل
        this.height = 15; // ارتفاع مرحله
        this.grid = [];
        this.coins = [];
        this.flagX = (this.width - 10) * TILE_SIZE;
        this.createLevelData();
    }

    createLevelData() {
        // ایجاد آرایه دوبعدی تمیز و ایزوله
        this.grid = Array.from({ length: this.height }, () => new Array(this.width).fill(TileType.AIR));

        // زمین اصلی با شکاف‌ها
        for (let col = 0; col < this.width; col++) {
            // گودال‌های استاندارد ماریو
            if ((col >= 30 && col <= 32) || (col >= 64 && col <= 66) || (col >= 110 && col <= 113)) {
                continue;
            }
            this.grid[13][col] = TileType.GROUND;
            this.grid[14][col] = TileType.GROUND;
        }

        // لوله‌ها (Pipes)
        this.addPipe(16, 11, 2);
        this.addPipe(24, 10, 3);
        this.addPipe(38, 9, 4);

        // بلوک‌های معما و آجری
        this.grid[9][10] = TileType.QUESTION;
        this.grid[9][14] = TileType.BRICK;
        this.grid[9][15] = TileType.QUESTION;
        this.grid[9][16] = TileType.BRICK;
        this.grid[9][17] = TileType.QUESTION;
        this.grid[5][15] = TileType.QUESTION;

        // سکوی هوایی آجری
        for (let col = 45; col <= 50; col++) {
            this.grid[9][col] = (col === 47 || col === 49) ? TileType.QUESTION : TileType.BRICK;
        }

        // پله‌های پایانی
        this.buildStairs(120, 12);

        // میله پرچم پایان مرحله
        for (let row = 3; row <= 12; row++) {
            this.grid[row][145] = TileType.FLAG_POLE;
        }
    }

    addPipe(col, topRow, height) {
        this.grid[topRow][col] = TileType.PIPE_TL;
        this.grid[topRow][col + 1] = TileType.PIPE_TR;
        for (let h = 1; h < height; h++) {
            this.grid[topRow + h][col] = TileType.PIPE_BL;
            this.grid[topRow + h][col + 1] = TileType.PIPE_BR;
        }
    }

    buildStairs(startCol, groundRow) {
        for (let i = 0; i < 6; i++) {
            for (let j = 0; j <= i; j++) {
                this.grid[groundRow - j][startCol + i] = TileType.BRICK;
            }
        }
    }

    getTile(row, col) {
        if (row < 0 || row >= this.height || col < 0 || col >= this.width) {
            return TileType.AIR;
        }
        return this.grid[row][col];
    }

    setTile(row, col, type) {
        if (row >= 0 && row < this.height && col >= 0 && col < this.width) {
            this.grid[row][col] = type;
        }
    }

    isSolid(tile) {
        return (
            tile === TileType.GROUND ||
            tile === TileType.BRICK ||
            tile === TileType.QUESTION ||
            tile === TileType.QUESTION_EMPTY ||
            tile === TileType.PIPE_TL ||
            tile === TileType.PIPE_TR ||
            tile === TileType.PIPE_BL ||
            tile === TileType.PIPE_BR
        );
    }

    resolveHorizontalCollisions(entity) {
        const leftCol = Math.floor(entity.x / TILE_SIZE);
        const rightCol = Math.floor((entity.x + entity.width) / TILE_SIZE);
        const topRow = Math.floor(entity.y / TILE_SIZE);
        const bottomRow = Math.floor((entity.y + entity.height - 1) / TILE_SIZE);

        for (let r = topRow; r <= bottomRow; r++) {
            if (entity.vx > 0) {
                if (this.isSolid(this.getTile(r, rightCol))) {
                    entity.x = rightCol * TILE_SIZE - entity.width;
                    entity.vx = 0;
                    break;
                }
            } else if (entity.vx < 0) {
                if (this.isSolid(this.getTile(r, leftCol))) {
                    entity.x = (leftCol + 1) * TILE_SIZE;
                    entity.vx = 0;
                    break;
                }
            }
        }
    }

    checkHorizontalWall(entity) {
        const leftCol = Math.floor(entity.x / TILE_SIZE);
        const rightCol = Math.floor((entity.x + entity.width) / TILE_SIZE);
        const midRow = Math.floor((entity.y + entity.height * 0.5) / TILE_SIZE);

        if (entity.vx > 0 && this.isSolid(this.getTile(midRow, rightCol))) {
            return true;
        }
        if (entity.vx < 0 && this.isSolid(this.getTile(midRow, leftCol))) {
            return true;
        }
        return false;
    }

    resolveVerticalCollisions(entity, audio = null) {
        const leftCol = Math.floor(entity.x / TILE_SIZE);
        const rightCol = Math.floor((entity.x + entity.width - 1) / TILE_SIZE);
        const topRow = Math.floor(entity.y / TILE_SIZE);
        const bottomRow = Math.floor((entity.y + entity.height) / TILE_SIZE);

        // برخورد به سقف (سر ماریو به بلوک)
        if (entity.vy < 0) {
            for (let c = leftCol; c <= rightCol; c++) {
                const tile = this.getTile(topRow, c);
                if (this.isSolid(tile)) {
                    entity.y = (topRow + 1) * TILE_SIZE;
                    entity.vy = 0;

                    if (tile === TileType.QUESTION) {
                        this.setTile(topRow, c, TileType.QUESTION_EMPTY);
                        if (audio) audio.playCoin();
                        if (entity.onHitQuestionBlock) {
                            entity.onHitQuestionBlock();
                        }
                    } else if (tile === TileType.BRICK && audio) {
                        audio.playStomp();
                    }
                    break;
                }
            }
        }

        // برخورد با زمین
        if (entity.vy >= 0) {
            for (let c = leftCol; c <= rightCol; c++) {
                if (this.isSolid(this.getTile(bottomRow, c))) {
                    entity.y = bottomRow * TILE_SIZE - entity.height;
                    entity.vy = 0;
                    entity.isGrounded = true;
                    break;
                }
            }
        }
    }

    render(ctx, cameraX, canvasWidth) {
        const startCol = Math.max(0, Math.floor(cameraX / TILE_SIZE));
        const endCol = Math.min(this.width, Math.ceil((cameraX + canvasWidth) / TILE_SIZE) + 1);

        for (let row = 0; row < this.height; row++) {
            for (let col = startCol; col < endCol; col++) {
                const tile = this.grid[row][col];
                if (tile === TileType.AIR) continue;

                const drawX = Math.round(col * TILE_SIZE - cameraX);
                const drawY = Math.round(row * TILE_SIZE);

                switch (tile) {
                    case TileType.GROUND:
                        ctx.fillStyle = '#b45309';
                        ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
                        ctx.fillStyle = '#22c55e'; // چمن روی زمین
                        ctx.fillRect(drawX, drawY, TILE_SIZE, 6);
                        break;

                    case TileType.BRICK:
                        ctx.fillStyle = '#b45309';
                        ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
                        ctx.strokeStyle = '#451a03';
                        ctx.strokeRect(drawX + 1, drawY + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                        break;

                    case TileType.QUESTION:
                        ctx.fillStyle = '#eab308';
                        ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
                        ctx.fillStyle = '#000';
                        ctx.font = 'bold 20px monospace';
                        ctx.fillText('?', drawX + 10, drawY + 23);
                        break;

                    case TileType.QUESTION_EMPTY:
                        ctx.fillStyle = '#78716c';
                        ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
                        ctx.strokeStyle = '#44403c';
                        ctx.strokeRect(drawX + 1, drawY + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                        break;

                    case TileType.PIPE_TL:
                    case TileType.PIPE_TR:
                    case TileType.PIPE_BL:
                    case TileType.PIPE_BR:
                        ctx.fillStyle = '#15803d';
                        ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
                        ctx.strokeStyle = '#14532d';
                        ctx.strokeRect(drawX + 1, drawY + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                        break;

                    case TileType.FLAG_POLE:
                        ctx.fillStyle = '#f8fafc';
                        ctx.fillRect(drawX + 12, drawY, 8, TILE_SIZE);
                        break;
                }
            }
        }
    }
}