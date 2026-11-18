import { TileMap, TILE_TYPES } from './TileMap.js';

/**
 * سازنده و پیکربندی‌کننده مرحله مشهور ۱-۱ بازی سوپر ماریو کلاسیک
 */
export class World1_1 {
  static create() {
    const COLS = 224;
    const ROWS = 15;
    const tileSize = 16;
    const tileMap = new TileMap(COLS, ROWS, tileSize);

    // ۱. ایجاد زمین یکپارچه در کف مرحله به ضخامت ۲ ردیف تایل (ردیف‌های ۱۳ و ۱۴)
    for (let c = 0; c < COLS; c++) {
      // ایجاد چاله‌ها (Gaps) دقیقاً مطابق نسخه NES
      const isPit = (c >= 69 && c <= 71) || (c >= 86 && c <= 89) || (c >= 153 && c <= 155);

      if (!isPit) {
        tileMap.setTile(c, 13, TILE_TYPES.GROUND);
        tileMap.setTile(c, 14, TILE_TYPES.GROUND);
      }
    }

    // ۲. تزیینات پس‌زمینه (ابرها و بوته‌ها)
    const clouds = [8, 19, 36, 56, 74, 91, 109, 126, 144, 162, 180];
    clouds.forEach((cx) => {
      tileMap.setTile(cx, 3, TILE_TYPES.DECOR_CLOUD_TL);
      tileMap.setTile(cx + 1, 3, TILE_TYPES.DECOR_CLOUD_TR);
      tileMap.setTile(cx, 4, TILE_TYPES.DECOR_CLOUD_BL);
      tileMap.setTile(cx + 1, 4, TILE_TYPES.DECOR_CLOUD_BR);
    });

    const bushes = [11, 23, 41, 59, 78, 96, 115, 132];
    bushes.forEach((bx) => {
      tileMap.setTile(bx, 12, TILE_TYPES.DECOR_BUSH_L);
      tileMap.setTile(bx + 1, 12, TILE_TYPES.DECOR_BUSH_M);
      tileMap.setTile(bx + 2, 12, TILE_TYPES.DECOR_BUSH_R);
    });

    // ۳. بلوک علامت سوال اول (Col 16, Row 9)
    tileMap.setTile(16, 9, TILE_TYPES.QUESTION_COIN);

    // ۴. ساختار خوشه‌ای: آجر - علامت سوال - آجر - علامت سوال - آجر (Cols 20..24, Row 9)
    tileMap.setTile(20, 9, TILE_TYPES.BRICK);
    tileMap.setTile(21, 9, TILE_TYPES.QUESTION_COIN);
    tileMap.setTile(22, 9, TILE_TYPES.BRICK);
    tileMap.setTile(23, 9, TILE_TYPES.QUESTION_COIN);
    tileMap.setTile(24, 9, TILE_TYPES.BRICK);

    // بلوک تکی مرتفع (Col 22, Row 5)
    tileMap.setTile(22, 5, TILE_TYPES.QUESTION_COIN);

    // ۵. لوله‌های سبز (Green Pipes) با ارتفاع‌های متفاوت
    World1_1.buildPipe(tileMap, 28, 13, 2); // لوله کوتاه ارتفاع ۲
    World1_1.buildPipe(tileMap, 38, 13, 3); // لوله متوسط ارتفاع ۳
    World1_1.buildPipe(tileMap, 46, 13, 4); // لوله بلند ارتفاع ۴
    World1_1.buildPipe(tileMap, 57, 13, 4); // لوله چهارم ارتفاع ۴

    // ۶. خوشه بلوک‌های پس از لوله‌ها (Cols 77..87)
    tileMap.setTile(77, 9, TILE_TYPES.BRICK);
    tileMap.setTile(78, 9, TILE_TYPES.QUESTION_COIN);
    tileMap.setTile(79, 9, TILE_TYPES.BRICK);

    // ردیف بالایی آجرها
    for (let c = 80; c <= 87; c++) {
      tileMap.setTile(c, 5, TILE_TYPES.BRICK);
    }

    // ۷. ردیف آجر و بلوک‌های سکه Cols 91..94
    for (let c = 91; c <= 93; c++) {
      tileMap.setTile(c, 5, TILE_TYPES.BRICK);
    }
    tileMap.setTile(94, 5, TILE_TYPES.QUESTION_COIN);
    tileMap.setTile(94, 9, TILE_TYPES.BRICK);

    // ۸. ساخت پله‌های هرمی سنگی (Staircases) قبل از پرچم
    World1_1.buildStairs(tileMap, 134, 13, 4, true);  // صعودی
    World1_1.buildStairs(tileMap, 140, 13, 4, false); // نزولی

    World1_1.buildStairs(tileMap, 148, 13, 4, true);
    World1_1.buildStairs(tileMap, 155, 13, 4, false);

    // هرم بزرگ نهایی منتهی به میله پرچم
    World1_1.buildStairs(tileMap, 181, 13, 8, true);

    // تک‌بلوک پایه پرچم (Col 198)
    tileMap.setTile(198, 12, TILE_TYPES.HARD_BLOCK);

    return tileMap;
  }

  /**
   * ساخت یک لوله سبز ۲ تایی در موقعیت و ارتفاع معین
   */
  static buildPipe(tileMap, col, groundRow, height) {
    const topRow = groundRow - height;

    // سر لوله
    tileMap.setTile(col, topRow, TILE_TYPES.PIPE_TOP_LEFT);
    tileMap.setTile(col + 1, topRow, TILE_TYPES.PIPE_TOP_RIGHT);

    // بدنه لوله
    for (let r = topRow + 1; r < groundRow; r++) {
      tileMap.setTile(col, r, TILE_TYPES.PIPE_BODY_LEFT);
      tileMap.setTile(col + 1, r, TILE_TYPES.PIPE_BODY_RIGHT);
    }
  }

  /**
   * ساخت پله‌های سنگی صعودی یا نزولی
   */
  static buildStairs(tileMap, startCol, groundRow, height, ascending = true) {
    for (let step = 1; step <= height; step++) {
      const col = ascending ? startCol + (step - 1) : startCol + (height - step);
      for (let h = 0; h < step; h++) {
        tileMap.setTile(col, groundRow - 1 - h, TILE_TYPES.HARD_BLOCK);
      }
    }
  }
}