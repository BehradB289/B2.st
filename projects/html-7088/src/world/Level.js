/**
 * B2.st Studio - Level Matrix & Map Bounds Security
 * مدیریت ساختار تایل‌های نقشه و برطرف‌سازی خطاهای Null Pointer مرزها
 */
"use strict";

import { Guardian } from "../security/Guardian.js";

export class Level {
    constructor() {
        this.tileSize = 32;
        this.cols = 70;
        this.rows = 15;
        this.map = [];
        this.buildLevel();
    }

    buildLevel() {
        // ایجاد نقشه با مقداردهی اولیه امن
        for (let r = 0; r < this.rows; r++) {
            this.map[r] = new Array(this.cols).fill(0);
        }

        // ایجاد زمین (تایل 1: زمین جامد)
        for (let c = 0; c < this.cols; c++) {
            this.map[13][c] = 1;
            this.map[14][c] = 1;
        }

        // ایجاد موانع و جعبه‌های کلاسیک ماریو
        this.map[9][10] = 2; // تایل 2: جعبه اسرارآمیز
        this.map[9][11] = 1; // تایل آجری
        this.map[9][12] = 2;
        this.map[9][13] = 1;
        this.map[5][12] = 2;

        // لوله‌های سبز (Pipes)
        this.map[12][20] = 3;
        this.map[11][20] = 3;
        this.map[12][28] = 3;
        this.map[11][28] = 3;
        this.map[10][28] = 3;

        // گودال (Pitfalls) برای اعتبارسنجی سقوط و عدم دسترسی نامعتبر
        this.map[13][35] = 0;
        this.map[14][35] = 0;
        this.map[13][36] = 0;
        this.map[14][36] = 0;

        // پله‌های پایانی
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j <= i; j++) {
                this.map[12 - j][50 + i] = 1;
            }
        }
    }

    /**
     * استعلام نوع تایل با پشتیبانی از سیستم بررسی امن محدوده (Boundary Safe Check)
     */
    getTile(col, row) {
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
            return 0; // در خارج از مرزها تایل پوچ فرض می‌شود
        }
        return this.map[row]?.[col] ?? 0;
    }

    isSolid(col, row) {
        const tile = this.getTile(col, row);
        return tile === 1 || tile === 2 || tile === 3;
    }

    render(ctx, cameraX) {
        const startCol = Math.max(0, Math.floor(cameraX / this.tileSize));
        const endCol = Math.min(this.cols, startCol + Math.ceil(ctx.canvas.width / this.tileSize) + 1);

        for (let r = 0; r < this.rows; r++) {
            for (let c = startCol; c < endCol; c++) {
                const tile = this.map[r][c];
                const x = Math.floor(c * this.tileSize - cameraX);
                const y = Math.floor(r * this.tileSize);

                if (tile === 1) {
                    // زمین و آجر قهوه‌ای
                    ctx.fillStyle = "#C84C0C";
                    ctx.fillRect(x, y, this.tileSize, this.tileSize);
                    ctx.strokeStyle = "#000000";
                    ctx.lineWidth = 1;
                    ctx.strokeRect(x, y, this.tileSize, this.tileSize);
                } else if (tile === 2) {
                    // جعبه شانس
                    ctx.fillStyle = "#FCB42C";
                    ctx.fillRect(x, y, this.tileSize, this.tileSize);
                    ctx.fillStyle = "#000000";
                    ctx.font = "bold 16px monospace";
                    ctx.fillText("?", x + 10, y + 22);
                    ctx.strokeRect(x, y, this.tileSize, this.tileSize);
                } else if (tile === 3) {
                    // لوله سبز
                    ctx.fillStyle = "#00A800";
                    ctx.fillRect(x, y, this.tileSize, this.tileSize);
                    ctx.strokeStyle = "#004000";
                    ctx.strokeRect(x, y, this.tileSize, this.tileSize);
                }
            }
        }
    }
}