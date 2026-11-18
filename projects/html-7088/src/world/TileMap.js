/**
 * @file TileMap.js
 * @description Grid-based level parser with strict memory access bounds.
 */

"use strict";

export class TileMap {
    constructor(tileSize = 32) {
        this.tileSize = tileSize;
        this.coinsCollected = 0;
        this.matrix = this._buildLevel();
    }

    _buildLevel() {
        // 1: Ground/Bricks, 2: Question block, 3: Hard block, 0: Sky
        const rawMap = [
            "0000000000000000000000000000000000000000000000000000000000000000",
            "0000000000000000000000000000000000000000000000000000000000000000",
            "0000000000000000000000000000000000000000000000000000000000000000",
            "0000000000000000000000000000000000000000000000000000000000000000",
            "0000000000000000000000000000000000000000000000000000000000000000",
            "0000000000000000000000000000000000000000000000000000000000000000",
            "0000000000000000000000000000000000000000000000000000000000000000",
            "0000000000000000000000000000000000000000000000000000000000000000",
            "0000000000000000000000000000000000000000000000000000000000000000",
            "0000000000000201020102000000000000000000000000000000000000000000",
            "0000000000000000000000000000000000000000000000000000000000000000",
            "0000000002000000000000000000000000000000000000000000000000000000",
            "0000000000000000000000000000000000000000000000000000000000000000",
            "1111111111111111111111111111000111111111111111111111111111111111",
            "1111111111111111111111111111000111111111111111111111111111111111"
        ];

        return rawMap.map(row => row.split("").map(ch => parseInt(ch, 10)));
    }

    getSolidTilesNearby(x, y, width, height) {
        const tiles = [];
        const minX = Math.max(0, Math.floor(x / this.tileSize));
        const maxX = Math.min(this.matrix[0].length - 1, Math.floor((x + width) / this.tileSize));
        const minY = Math.max(0, Math.floor(y / this.tileSize));
        const maxY = Math.min(this.matrix.length - 1, Math.floor((y + height) / this.tileSize));

        for (let row = minY; row <= maxY; row++) {
            for (let col = minX; col <= maxX; col++) {
                const typeCode = this.matrix[row]?.[col];
                if (typeCode && typeCode > 0) {
                    tiles.push({
                        x: col * this.tileSize,
                        y: row * this.tileSize,
                        width: this.tileSize,
                        height: this.tileSize,
                        type: typeCode === 2 ? "question" : "solid",
                        gridX: col,
                        gridY: row
                    });
                }
            }
        }
        return tiles;
    }

    hitQuestionBlock(gridX, gridY) {
        if (this.matrix[gridY]?.[gridX] === 2) {
            this.matrix[gridY][gridX] = 3; // Turn into empty metal block
            this.coinsCollected += 1;
            const coinSoundEffect = new CustomEvent("coinCollected", { detail: { count: this.coinsCollected } });
            window.dispatchEvent(coinSoundEffect);
        }
    }

    render(ctx, cameraX) {
        for (let row = 0; row < this.matrix.length; row++) {
            for (let col = 0; col < this.matrix[row].length; col++) {
                const cell = this.matrix[row][col];
                const drawX = Math.floor(col * this.tileSize - cameraX);
                const drawY = Math.floor(row * this.tileSize);

                if (drawX + this.tileSize < 0 || drawX > ctx.canvas.width) continue;

                if (cell === 1) {
                    // Brick block
                    ctx.fillStyle = "#d8601c";
                    ctx.fillRect(drawX, drawY, this.tileSize, this.tileSize);
                    ctx.fillStyle = "#000000";
                    ctx.strokeRect(drawX, drawY, this.tileSize, this.tileSize);
                } else if (cell === 2) {
                    // Question block
                    ctx.fillStyle = "#fcb42c";
                    ctx.fillRect(drawX, drawY, this.tileSize, this.tileSize);
                    ctx.fillStyle = "#ffffff";
                    ctx.font = "bold 18px monospace";
                    ctx.fillText("?", drawX + 10, drawY + 22);
                    ctx.strokeRect(drawX, drawY, this.tileSize, this.tileSize);
                } else if (cell === 3) {
                    // Empty Question block
                    ctx.fillStyle = "#948064";
                    ctx.fillRect(drawX, drawY, this.tileSize, this.tileSize);
                    ctx.strokeRect(drawX, drawY, this.tileSize, this.tileSize);
                }
            }
        }
    }
}