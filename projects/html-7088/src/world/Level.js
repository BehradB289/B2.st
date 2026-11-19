/**
 * @file Level.js
 * @description ماتریس استیج و تشخیص دقیق بلاک‌های بازی
 */

export class Level {
    constructor() {
        this.tileSize = 32;
        this.gravity = 1100;
        this.width = 100 * this.tileSize;
        this.height = 400;

        // نقشه‌برداری ساده بلاک‌های محیطی: 0: خالی, 1: زمین, 2: آجر, 3: سوال (بونوس)
        this.tiles = [];
        this._buildWorld();
    }

    _buildWorld() {
        const rows = Math.ceil(this.height / this.tileSize);
        const cols = Math.ceil(this.width / this.tileSize);

        for (let y = 0; y < rows; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < cols; x++) {
                if (y >= rows - 2) {
                    // دو ردیف آخر کف زمین است
                    this.tiles[y][x] = 1;
                } else if (y === rows - 5 && (x % 7 === 0 || x % 7 === 1)) {
                    // پلتفرم‌های آجری معلق
                    this.tiles[y][x] = (x % 2 === 0) ? 2 : 3;
                } else {
                    this.tiles[y][x] = 0;
                }
            }
        }
    }

    /**
     * بررسی برخورد بر اساس مختصات پیکسلی
     * @param {number} x 
     * @param {number} y 
     * @returns {number} نوع تایل برخورد کرده
     */
    getTileAt(x, y) {
        const col = Math.floor(x / this.tileSize);
        const row = Math.floor(y / this.tileSize);

        if (row < 0 || row >= this.tiles.length || col < 0 || col >= this.tiles[0].length) {
            return 0;
        }

        return this.tiles[row][col];
    }

    /**
     * رندر تایل‌ها در ویوپورت دوربین
     * @param {CanvasRenderingContext2D} ctx 
     * @param {number} cameraX 
     */
    render(ctx, cameraX) {
        const startCol = Math.max(0, Math.floor(cameraX / this.tileSize));
        const endCol = Math.min(
            this.tiles[0].length,
            Math.ceil((cameraX + ctx.canvas.width) / this.tileSize) + 1
        );

        for (let y = 0; y < this.tiles.length; y++) {
            for (let x = startCol; x < endCol; x++) {
                const type = this.tiles[y][x];
                if (type === 0) continue;

                const drawX = Math.floor(x * this.tileSize - cameraX);
                const drawY = y * this.tileSize;

                if (type === 1) {
                    // زمین سبز
                    ctx.fillStyle = '#10b981';
                    ctx.fillRect(drawX, drawY, this.tileSize, this.tileSize);
                    ctx.strokeStyle = '#065f46';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(drawX, drawY, this.tileSize, this.tileSize);
                } else if (type === 2) {
                    // آجر
                    ctx.fillStyle = '#b45309';
                    ctx.fillRect(drawX, drawY, this.tileSize, this.tileSize);
                    ctx.fillStyle = '#78350f';
                    ctx.fillRect(drawX + 2, drawY + 2, this.tileSize - 4, this.tileSize - 4);
                } else if (type === 3) {
                    // جعبه شانس
                    ctx.fillStyle = '#f59e0b';
                    ctx.fillRect(drawX, drawY, this.tileSize, this.tileSize);
                    ctx.fillStyle = '#ffffff';
                    ctx.font = '16px monospace';
                    ctx.fillText('?', drawX + 11, drawY + 22);
                }
            }
        }
    }
}