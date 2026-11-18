import { sound } from '../engine/Audio.js';
import { BrickPiece, BouncingCoin, FloatingScore } from '../entities/Particle.js';

/**
 * ثابت‌های شناسایی انواع تایل‌ها
 */
export const TILE_TYPES = {
  EMPTY: 0,
  GROUND: 1,
  BRICK: 2,
  QUESTION_COIN: 3,
  QUESTION_EMPTY: 4,
  PIPE_TOP_LEFT: 5,
  PIPE_TOP_RIGHT: 6,
  PIPE_BODY_LEFT: 7,
  PIPE_BODY_RIGHT: 8,
  HARD_BLOCK: 9,
  DECOR_BUSH_L: 10,
  DECOR_BUSH_M: 11,
  DECOR_BUSH_R: 12,
  DECOR_CLOUD_TL: 13,
  DECOR_CLOUD_TR: 14,
  DECOR_CLOUD_BL: 15,
  DECOR_CLOUD_BR: 16
};

/**
 * سیستم تایل‌مپ پویا با Viewport Culling، بلوک‌های جهنده، آجر خردشونده و سکه
 */
export class TileMap {
  constructor(cols, rows, tileSize = 16) {
    this.cols = cols;
    this.rows = rows;
    this.tileSize = tileSize;
    this.grid = new Uint8Array(cols * rows);

    // نگه‌داری انیمیشن جهش موقت بلوک‌ها پس از ضربه
    this.bumpedBlocks = new Map(); // key: "col,row" -> { offsetY, timer, initialY }
    this.particles = [];
  }

  setTile(col, row, tileType) {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return;
    this.grid[row * this.cols + col] = tileType;
  }

  getTile(col, row) {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
      return TILE_TYPES.EMPTY;
    }
    return this.grid[row * this.cols + col];
  }

  /**
   * آیا تایل سالید و غیرقابل عبور فیزیکی است؟
   */
  isSolid(col, row) {
    const tile = this.getTile(col, row);
    return (
      tile === TILE_TYPES.GROUND ||
      tile === TILE_TYPES.BRICK ||
      tile === TILE_TYPES.QUESTION_COIN ||
      tile === TILE_TYPES.QUESTION_EMPTY ||
      tile === TILE_TYPES.PIPE_TOP_LEFT ||
      tile === TILE_TYPES.PIPE_TOP_RIGHT ||
      tile === TILE_TYPES.PIPE_BODY_LEFT ||
      tile === TILE_TYPES.PIPE_BODY_RIGHT ||
      tile === TILE_TYPES.HARD_BLOCK
    );
  }

  /**
   * تعامل و ضربه زدن به بلوک توسط سر ماریو
   */
  bumpTile(col, row, player, gameContext) {
    const tile = this.getTile(col, row);
    const key = `${col},${row}`;

    // ۱. بلوک علامت سوال حاوی سکه
    if (tile === TILE_TYPES.QUESTION_COIN) {
      this.setTile(col, row, TILE_TYPES.QUESTION_EMPTY);
      this.startBlockBump(key, col, row);

      // ایجاد سکه جهنده
      const coinX = col * this.tileSize + 3;
      const coinY = (row - 1) * this.tileSize;
      this.particles.push(new BouncingCoin(coinX, coinY));
      this.particles.push(new FloatingScore(col * this.tileSize, (row - 1) * this.tileSize, '200'));

      sound.playCoin();
      if (gameContext) {
        gameContext.addScore(200);
        gameContext.addCoin();
      }
      return;
    }

    // ۲. بلوک علامت سوال خالی قبلاً مصرف شده
    if (tile === TILE_TYPES.QUESTION_EMPTY || tile === TILE_TYPES.HARD_BLOCK) {
      sound.playBlockBump();
      return;
    }

    // ۳. بلوک آجری
    if (tile === TILE_TYPES.BRICK) {
      // اگر ماریو بزرگ بود آجر کامل متلاشی می‌شد، برای ماریوی استاندارد در صورت عدم وجود قابلیت ویژه،
      // تخریب شکوهمندانه آجر به همراه ۴ ذره ایجاد می‌شود
      this.setTile(col, row, TILE_TYPES.EMPTY);

      const px = col * this.tileSize;
      const py = row * this.tileSize;

      // ۴ تکه آجر با سرعت‌های زاویه‌ای متفاوت
      this.particles.push(new BrickPiece(px, py, -90, -320));
      this.particles.push(new BrickPiece(px + 8, py, 90, -320));
      this.particles.push(new BrickPiece(px, py + 8, -70, -220));
      this.particles.push(new BrickPiece(px + 8, py + 8, 70, -220));

      this.particles.push(new FloatingScore(px, py, '50'));
      sound.playBrickBreak();

      if (gameContext) {
        gameContext.addScore(50);
      }
    }
  }

  startBlockBump(key, col, row) {
    this.bumpedBlocks.set(key, {
      col,
      row,
      time: 0,
      offsetY: 0
    });
  }

  update(dt) {
    // بروزرسانی انیمیشن ارتعاش الاستیک بلوک‌های ضربه‌خورده
    for (const [key, bump] of this.bumpedBlocks.entries()) {
      bump.time += dt * 15;
      // تابع سینوسی برای بالا رفتن و بازگشت ملایم
      bump.offsetY = -Math.sin(bump.time * Math.PI) * 6;

      if (bump.time >= 1.0) {
        this.bumpedBlocks.delete(key);
      }
    }

    // بروزرسانی سیستم ذرات
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update(dt);
      if (p.isDead) {
        this.particles.splice(i, 1);
      }
    }
  }

  /**
   * رندر کارآمد تایل‌ها با فیلتر دید دوربین (Viewport Culling)
   */
  render(ctx, camera) {
    const { startCol, endCol, startRow, endRow } = camera.getVisibleTileRange(this.tileSize);

    const sCol = Math.max(0, startCol);
    const eCol = Math.min(this.cols - 1, endCol);
    const sRow = Math.max(0, startRow);
    const eRow = Math.min(this.rows - 1, endRow);

    for (let r = sRow; r <= eRow; r++) {
      for (let c = sCol; c <= eCol; c++) {
        const tile = this.getTile(c, r);
        if (tile === TILE_TYPES.EMPTY) continue;

        let renderY = r * this.tileSize;
        const key = `${c},${r}`;
        if (this.bumpedBlocks.has(key)) {
          renderY += this.bumpedBlocks.get(key).offsetY;
        }

        this.drawTile(ctx, tile, c * this.tileSize, renderY);
      }
    }

    // رندر ذرات در بالای تایل‌ها
    for (const p of this.particles) {
      if (camera.isVisible(p.pos.x, p.pos.y, p.width, p.height)) {
        p.render(ctx);
      }
    }
  }

  /**
   * ترسیم پیکسلی و باکیفیت هر تایل استاندارد NES
   */
  drawTile(ctx, tile, x, y) {
    const ts = this.tileSize;

    switch (tile) {
      case TILE_TYPES.GROUND:
        // زمین کلاسیک خاکی ماریو
        ctx.fillStyle = '#b84418';
        ctx.fillRect(x, y, ts, ts);
        ctx.fillStyle = '#fc9838';
        ctx.fillRect(x, y, ts, 2);
        ctx.fillRect(x, y + 2, 2, ts - 2);
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + ts - 2, y + 2, 2, ts - 2);
        ctx.fillRect(x, y + ts - 2, ts, 2);
        break;

      case TILE_TYPES.BRICK:
        // آجر قهوه‌ای تیره با خطوط بندکشی
        ctx.fillStyle = '#b84418';
        ctx.fillRect(x, y, ts, ts);
        ctx.fillStyle = '#000000';
        // شیارهای افقی و عمودی آجر
        ctx.fillRect(x, y + 7, ts, 1);
        ctx.fillRect(x, y + 15, ts, 1);
        ctx.fillRect(x + 7, y, 1, 7);
        ctx.fillRect(x + 3, y + 8, 1, 7);
        ctx.fillRect(x + 11, y + 8, 1, 7);
        ctx.fillStyle = '#fc9838';
        ctx.fillRect(x + 1, y + 1, 6, 1);
        ctx.fillRect(x + 9, y + 1, 6, 1);
        break;

      case TILE_TYPES.QUESTION_COIN: {
        // بلوک چشمک‌زن زرد با علامت سوال
        ctx.fillStyle = '#fc9838';
        ctx.fillRect(x, y, ts, ts);
        ctx.fillStyle = '#fcd800';
        ctx.fillRect(x + 1, y + 1, ts - 2, ts - 2);

        // ۴ پیچ گوشه‌ای
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + 1, y + 1, 1, 1);
        ctx.fillRect(x + ts - 2, y + 1, 1, 1);
        ctx.fillRect(x + 1, y + ts - 2, 1, 1);
        ctx.fillRect(x + ts - 2, y + ts - 2, 1, 1);

        // علامت سوال پیکسلی
        ctx.fillStyle = '#b84418';
        ctx.fillRect(x + 5, y + 3, 6, 2);
        ctx.fillRect(x + 9, y + 5, 2, 3);
        ctx.fillRect(x + 6, y + 7, 4, 2);
        ctx.fillRect(x + 6, y + 9, 2, 2);
        ctx.fillRect(x + 6, y + 12, 2, 2);
        break;
      }

      case TILE_TYPES.QUESTION_EMPTY:
        // بلوک قهوه‌ای فلزی خالی پس از خرج شدن سکه
        ctx.fillStyle = '#8c5800';
        ctx.fillRect(x, y, ts, ts);
        ctx.fillStyle = '#5c3800';
        ctx.fillRect(x + 1, y + 1, ts - 2, ts - 2);
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + 2, y + 2, 2, 2);
        ctx.fillRect(x + ts - 4, y + 2, 2, 2);
        ctx.fillRect(x + 2, y + ts - 4, 2, 2);
        ctx.fillRect(x + ts - 4, y + ts - 4, 2, 2);
        break;

      case TILE_TYPES.PIPE_TOP_LEFT:
        ctx.fillStyle = '#00a800';
        ctx.fillRect(x, y, ts, ts);
        ctx.fillStyle = '#80d010';
        ctx.fillRect(x + 2, y, 4, ts);
        ctx.fillStyle = '#005000';
        ctx.fillRect(x + ts - 3, y, 3, ts);
        ctx.fillStyle = '#000000';
        ctx.fillRect(x, y, 1, ts);
        ctx.fillRect(x, y, ts, 2);
        break;

      case TILE_TYPES.PIPE_TOP_RIGHT:
        ctx.fillStyle = '#00a800';
        ctx.fillRect(x, y, ts, ts);
        ctx.fillStyle = '#80d010';
        ctx.fillRect(x + 1, y, 2, ts);
        ctx.fillStyle = '#005000';
        ctx.fillRect(x + ts - 4, y, 4, ts);
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + ts - 1, y, 1, ts);
        ctx.fillRect(x, y, ts, 2);
        break;

      case TILE_TYPES.PIPE_BODY_LEFT:
        ctx.fillStyle = '#00a800';
        ctx.fillRect(x + 2, y, ts - 2, ts);
        ctx.fillStyle = '#80d010';
        ctx.fillRect(x + 4, y, 4, ts);
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + 2, y, 1, ts);
        break;

      case TILE_TYPES.PIPE_BODY_RIGHT:
        ctx.fillStyle = '#00a800';
        ctx.fillRect(x, y, ts - 2, ts);
        ctx.fillStyle = '#005000';
        ctx.fillRect(x + ts - 5, y, 3, ts);
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + ts - 3, y, 1, ts);
        break;

      case TILE_TYPES.HARD_BLOCK:
        // بلوک سنگ خاکستری پله‌ها
        ctx.fillStyle = '#000000';
        ctx.fillRect(x, y, ts, ts);
        ctx.fillStyle = '#fc9838';
        ctx.fillRect(x, y, ts - 1, ts - 1);
        ctx.fillStyle = '#b84418';
        ctx.fillRect(x + 1, y + 1, ts - 2, ts - 2);
        break;

      case TILE_TYPES.DECOR_BUSH_L:
      case TILE_TYPES.DECOR_BUSH_M:
      case TILE_TYPES.DECOR_BUSH_R:
        // بوته‌های سبز تزیینی
        ctx.fillStyle = '#00a800';
        ctx.beginPath();
        ctx.arc(x + 8, y + 12, 8, Math.PI, 0, false);
        ctx.fill();
        ctx.fillStyle = '#80d010';
        ctx.fillRect(x + 4, y + 8, 4, 3);
        break;

      case TILE_TYPES.DECOR_CLOUD_TL:
      case TILE_TYPES.DECOR_CLOUD_TR:
      case TILE_TYPES.DECOR_CLOUD_BL:
      case TILE_TYPES.DECOR_CLOUD_BR:
        // ابرهای سفید آسمان
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, y, ts, ts);
        ctx.fillStyle = '#a4e4fc';
        ctx.fillRect(x + 2, y + 10, ts - 4, 4);
        break;
    }
  }
}