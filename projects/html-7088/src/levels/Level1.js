/**
 * استودیو B2.st - ژنراتور مرحله ۱-۱ کلاسیک ماریو
 */
import { TileMap, TILE_TYPES } from './TileMap.js';
import { Goomba } from '../entities/Goomba.js';

export class Level1 {
    constructor() {
        this.cols = 212;
        this.rows = 15;
        this.tileMap = new TileMap(this.cols, this.rows);
        this.enemies = [];
        this._buildMap();
    }

    _buildMap() {
        // زمین پایه
        for (let c = 0; c < this.cols; c++) {
            // ساخت چاله‌ها
            if ((c >= 69 && c <= 71) || (c >= 86 && c <= 89) || (c >= 153 && c <= 155)) {
                continue;
            }
            this.tileMap.setTile(c, 13, TILE_TYPES.GROUND);
            this.tileMap.setTile(c, 14, TILE_TYPES.GROUND);
        }

        // علامت‌های سوال و بلوک‌های آجری اولیه
        this.tileMap.setTile(16, 9, TILE_TYPES.QUESTION_COIN);
        this.tileMap.setTile(20, 9, TILE_TYPES.BRICK);
        this.tileMap.setTile(21, 9, TILE_TYPES.QUESTION_MUSHROOM);
        this.tileMap.setTile(22, 9, TILE_TYPES.BRICK);
        this.tileMap.setTile(23, 9, TILE_TYPES.QUESTION_COIN);
        this.tileMap.setTile(24, 9, TILE_TYPES.BRICK);
        this.tileMap.setTile(22, 5, TILE_TYPES.QUESTION_COIN);

        // لوله سبز اول (ارتفاع ۲ تایل)
        this._buildPipe(28, 11, 2);
        // لوله سبز دوم (ارتفاع ۳ تایل)
        this._buildPipe(38, 10, 3);
        // لوله سبز سوم (ارتفاع ۴ تایل)
        this._buildPipe(46, 9, 4);

        // ایجاد دشمنان گومبا در مختصات استراتژیک مرحله
        this.enemies.push(new Goomba(22 * 16, 12 * 16));
        this.enemies.push(new Goomba(40 * 16, 12 * 16));
        this.enemies.push(new Goomba(51 * 16, 12 * 16));
        this.enemies.push(new Goomba(53 * 16, 12 * 16));
        this.enemies.push(new Goomba(80 * 16, 12 * 16));
        this.enemies.push(new Goomba(82 * 16, 12 * 16));
        this.enemies.push(new Goomba(97 * 16, 12 * 16));
    }

    _buildPipe(col, startRow, height) {
        this.tileMap.setTile(col, startRow, TILE_TYPES.PIPE_TOP_LEFT);
        this.tileMap.setTile(col + 1, startRow, TILE_TYPES.PIPE_TOP_RIGHT);
        for (let r = startRow + 1; r < startRow + height; r++) {
            this.tileMap.setTile(col, r, TILE_TYPES.PIPE_BODY_LEFT);
            this.tileMap.setTile(col + 1, r, TILE_TYPES.PIPE_BODY_RIGHT);
        }
    }
}