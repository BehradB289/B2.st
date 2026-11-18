/**
 * داده‌های جامع ۱۰ مرحله با تنوع کامل بصری و اقلیمی
 * هر مرحله شامل المان‌های ساختاری، تایل‌های تعاملی، موانع و باس نهایی است.
 */
export const LEVELS_CONFIG = [
  {
    id: 1,
    name: '1-1 دشت‌های طلایی (Golden Plains)',
    theme: 'overworld',
    bgColor: '#5c94fc',
    width: 90,
    height: 15,
    enemies: [
      { x: 18, y: 12, type: 'goomba' },
      { x: 28, y: 12, type: 'goomba' },
      { x: 42, y: 12, type: 'koopa' },
      { x: 60, y: 12, type: 'goomba' },
      { x: 63, y: 12, type: 'goomba' }
    ],
    generate(level) {
      level.fillFloor(0, 90, 13);
      // سکوها و بلوک‌های علامت سوال
      level.setQuestion(12, 9, 'coin');
      level.setBrick(14, 9);
      level.setQuestion(15, 9, 'powerup');
      level.setBrick(16, 9);
      level.setQuestion(17, 9, 'coin');

      // لوله‌ها
      level.buildPipe(22, 11, 2);
      level.buildPipe(34, 10, 3);
      level.buildPipe(50, 9, 4);

      // پله‌های پرچم پایان
      level.buildStairs(72, 12, 5, 1);
      level.setFlagpole(82, 12);
    }
  },
  {
    id: 2,
    name: '1-2 غار کریستالی زیرزمینی (Underworld Cavern)',
    theme: 'underground',
    bgColor: '#000000',
    width: 95,
    height: 15,
    enemies: [
      { x: 15, y: 12, type: 'goomba' },
      { x: 25, y: 12, type: 'koopa' },
      { x: 38, y: 12, type: 'koopa' },
      { x: 55, y: 12, type: 'goomba' },
      { x: 70, y: 12, type: 'koopa' }
    ],
    generate(level) {
      level.fillFloor(0, 95, 13);
      level.fillCeiling(0, 95, 0); // سقف بسته غار

      // سکوهای معلق غار
      for (let x = 18; x < 26; x++) level.setBrick(x, 8);
      for (let x = 32; x < 40; x++) level.setBrick(x, 6);
      for (let x = 45; x < 55; x++) level.setBrick(x, 8);

      level.setQuestion(21, 5, 'coin');
      level.setQuestion(35, 3, 'powerup');

      level.buildPipe(62, 11, 2);
      level.setFlagpole(86, 12);
    }
  },
  {
    id: 3,
    name: '1-3 بلندی‌های قارچی و دره‌ها (Mushroom Heights)',
    theme: 'overworld',
    bgColor: '#6b8cff',
    width: 100,
    height: 15,
    enemies: [
      { x: 22, y: 6, type: 'koopa' },
      { x: 45, y: 5, type: 'koopa' },
      { x: 68, y: 7, type: 'goomba' }
    ],
    generate(level) {
      // ایجاد دره‌های عمیق با سکوهای قارچی
      level.fillFloor(0, 15, 13);
      level.fillFloor(20, 30, 8); // قارچ بلند ۱
      level.fillFloor(35, 48, 6); // قارچ بلند ۲
      level.fillFloor(52, 62, 9);
      level.fillFloor(66, 76, 7);
      level.fillFloor(80, 100, 13);

      level.setFlagpole(92, 12);
    }
  },
  {
    id: 4,
    name: '1-4 کویر سوزان و اهرام ماسه‌ای (Desert Mirage)',
    theme: 'overworld',
    bgColor: '#e8b068',
    width: 95,
    height: 15,
    enemies: [
      { x: 20, y: 12, type: 'goomba' },
      { x: 35, y: 12, type: 'goomba' },
      { x: 50, y: 12, type: 'koopa' },
      { x: 65, y: 12, type: 'koopa' }
    ],
    generate(level) {
      level.fillFloor(0, 95, 13);
      // ساخت هرم پله‌ای در مرکز
      level.buildStairs(28, 12, 6, 1);
      level.buildStairs(35, 12, 6, -1);

      level.buildPipe(48, 10, 3);
      level.buildPipe(58, 9, 4);

      level.setFlagpole(86, 12);
    }
  },
  {
    id: 5,
    name: '1-5 قلعه آتشین میانی (Fiery Fortress)',
    theme: 'castle',
    bgColor: '#1a0505',
    width: 100,
    height: 15,
    enemies: [
      { x: 24, y: 12, type: 'koopa' },
      { x: 42, y: 12, type: 'koopa' },
      { x: 65, y: 12, type: 'koopa' }
    ],
    generate(level) {
      level.fillFloor(0, 30, 13);
      // گودال مواد مذاب
      level.fillFloor(38, 70, 13);
      level.fillFloor(78, 100, 13);

      level.fillCeiling(0, 100, 0);

      // موانع معلق قلعه
      for (let x = 31; x <= 36; x++) level.setBrick(x, 9);
      for (let x = 71; x <= 76; x++) level.setBrick(x, 9);

      level.setFlagpole(90, 12);
    }
  },
  {
    id: 6,
    name: '2-1 قله‌های یخی و لغزنده (Frozen Glacier)',
    theme: 'underground',
    bgColor: '#70a0d0',
    width: 95,
    height: 15,
    enemies: [
      { x: 22, y: 12, type: 'goomba' },
      { x: 40, y: 12, type: 'koopa' },
      { x: 60, y: 12, type: 'koopa' }
    ],
    generate(level) {
      level.fillFloor(0, 95, 13);
      // سکوهای یخی متوالی
      for (let i = 0; i < 4; i++) {
        const sx = 18 + i * 14;
        for (let x = sx; x < sx + 6; x++) {
          level.setBrick(x, 10 - (i % 2) * 2);
        }
      }
      level.setFlagpole(85, 12);
    }
  },
  {
    id: 7,
    name: '2-2 دخمه ارواح و توهمات (Ghost Crypt)',
    theme: 'castle',
    bgColor: '#101018',
    width: 90,
    height: 15,
    enemies: [
      { x: 20, y: 12, type: 'goomba' },
      { x: 36, y: 12, type: 'goomba' },
      { x: 52, y: 12, type: 'koopa' }
    ],
    generate(level) {
      level.fillFloor(0, 90, 13);
      level.fillCeiling(0, 90, 0);

      // هزارتوی موانع مرموز
      for (let x = 15; x < 75; x += 8) {
        level.setBrick(x, 8);
        level.setQuestion(x + 1, 8, 'coin');
        level.setBrick(x + 2, 8);
      }

      level.setFlagpole(80, 12);
    }
  },
  {
    id: 8,
    name: '2-3 آسمان طوفانی و پیچک‌های رونده (Skyward Canopy)',
    theme: 'overworld',
    bgColor: '#2a4d6c',
    width: 105,
    height: 15,
    enemies: [
      { x: 25, y: 8, type: 'koopa' },
      { x: 50, y: 6, type: 'koopa' },
      { x: 75, y: 7, type: 'koopa' }
    ],
    generate(level) {
      // سقوط آزاد در صورت افتادن از سکوهای هوایی
      level.fillFloor(0, 12, 13);
      level.fillFloor(16, 28, 9);
      level.fillFloor(32, 44, 7);
      level.fillFloor(48, 62, 5);
      level.fillFloor(66, 80, 8);
      level.fillFloor(84, 105, 13);

      level.setFlagpole(96, 12);
    }
  },
  {
    id: 9,
    name: '2-4 ناوگان هوایی نبرد (Iron Airship)',
    theme: 'castle',
    bgColor: '#201824',
    width: 110,
    height: 15,
    enemies: [
      { x: 20, y: 12, type: 'koopa' },
      { x: 38, y: 12, type: 'koopa' },
      { x: 55, y: 12, type: 'koopa' },
      { x: 72, y: 12, type: 'koopa' }
    ],
    generate(level) {
      level.fillFloor(0, 110, 13);
      // توپ‌ها و لوله‌های کشتی جنگی
      level.buildPipe(25, 11, 2);
      level.buildPipe(40, 10, 3);
      level.buildPipe(60, 9, 4);
      level.buildPipe(78, 10, 3);

      level.setFlagpole(100, 12);
    }
  },
  {
    id: 10,
    name: 'FINAL قلعه تاریک باوزر (Bowser\'s Ultimate Citadel)',
    theme: 'castle',
    bgColor: '#0c0004',
    width: 115,
    height: 15,
    enemies: [
      { x: 25, y: 12, type: 'koopa' },
      { x: 45, y: 12, type: 'koopa' },
      { x: 65, y: 12, type: 'koopa' },
      { x: 88, y: 11, type: 'koopa' } // نگهبان پل
    ],
    generate(level) {
      level.fillCeiling(0, 115, 0);
      level.fillFloor(0, 35, 13);
      // گودال بزرگ گدازه زیر پل نبرد
      level.fillFloor(50, 75, 13);
      level.fillFloor(82, 115, 13);

      // پل معلق روی آتش
      for (let x = 36; x < 50; x++) level.setBrick(x, 10);
      for (let x = 76; x < 82; x++) level.setBrick(x, 10);

      // تبر نجات و قفس پیروزی
      level.setFlagpole(105, 12);
    }
  }
];

/**
 * مدیر ساخت و دسترسی به ساختار تایل‌مپ هر مرحله
 */
export class Level {
  constructor(config, tileSize = 32) {
    this.config = config;
    this.tileSize = tileSize;
    this.cols = config.width;
    this.rows = config.height;
    this.tiles = Array(this.rows).fill(null).map(() => Array(this.cols).fill(null));
    this.flagpole = null;

    // کامپایل نقشه بر اساس مشخصات لول
    config.generate(this);
  }

  fillFloor(startCol, endCol, row) {
    for (let c = startCol; c < endCol; c++) {
      for (let r = row; r < this.rows; r++) {
        this.tiles[r][c] = { solid: true, type: 'ground' };
      }
    }
  }

  fillCeiling(startCol, endCol, row) {
    for (let c = startCol; c < endCol; c++) {
      this.tiles[row][c] = { solid: true, type: 'brick' };
    }
  }

  setBrick(c, r) {
    if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
      this.tiles[r][c] = { solid: true, type: 'brick' };
    }
  }

  setQuestion(c, r, content = 'coin') {
    if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
      this.tiles[r][c] = { solid: true, type: 'question', content, hit: false };
    }
  }

  buildPipe(c, startR, height) {
    for (let h = 0; h < height; h++) {
      const r = startR + h;
      if (r < this.rows) {
        this.tiles[r][c] = { solid: true, type: h === 0 ? 'pipe-tl' : 'pipe-l' };
        this.tiles[r][c + 1] = { solid: true, type: h === 0 ? 'pipe-tr' : 'pipe-r' };
      }
    }
  }

  buildStairs(startC, startR, steps, dir = 1) {
    for (let s = 0; s < steps; s++) {
      const col = dir === 1 ? startC + s : startC - s;
      for (let r = startR - s; r <= startR; r++) {
        if (col >= 0 && col < this.cols && r >= 0 && r < this.rows) {
          this.tiles[r][col] = { solid: true, type: 'brick' };
        }
      }
    }
  }

  setFlagpole(c, r) {
    this.flagpole = { x: c * this.tileSize, y: (r - 9) * this.tileSize, height: 10 * this.tileSize };
  }

  getTile(col, row) {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
      return null;
    }
    return this.tiles[row][col];
  }

  draw(ctx, spriteFactory, camera) {
    const startCol = Math.max(0, Math.floor(camera.x / this.tileSize));
    const endCol = Math.min(this.cols - 1, Math.ceil((camera.x + camera.width) / this.tileSize));

    const groundImg = spriteFactory.getGroundTile(this.config.theme);
    const brickImg = spriteFactory.getBrickTile(this.config.theme);
    const questionImg = spriteFactory.getQuestionBlock();
    const pipeTL = spriteFactory.getPipeTile('top-left');
    const pipeTR = spriteFactory.getPipeTile('top-right');

    for (let r = 0; r < this.rows; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const tile = this.tiles[r][c];
        if (!tile) continue;

        const px = c * this.tileSize;
        const py = r * this.tileSize;

        if (tile.type === 'ground') {
          ctx.drawImage(groundImg, px, py, this.tileSize, this.tileSize);
        } else if (tile.type === 'brick') {
          ctx.drawImage(brickImg, px, py, this.tileSize, this.tileSize);
        } else if (tile.type === 'question') {
          ctx.drawImage(questionImg, px, py, this.tileSize, this.tileSize);
        } else if (tile.type === 'pipe-tl' || tile.type === 'pipe-l') {
          ctx.drawImage(pipeTL, px, py, this.tileSize, this.tileSize);
        } else if (tile.type === 'pipe-tr' || tile.type === 'pipe-r') {
          ctx.drawImage(pipeTR, px, py, this.tileSize, this.tileSize);
        }
      }
    }

    // رسم میله پرچم پایان مرحله
    if (this.flagpole) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(this.flagpole.x + 14, this.flagpole.y, 4, this.flagpole.height);

      ctx.fillStyle = '#00a800';
      ctx.beginPath();
      ctx.arc(this.flagpole.x + 16, this.flagpole.y, 8, 0, Math.PI * 2);
      ctx.fill();

      // پرچم
      ctx.fillStyle = '#ff2222';
      ctx.beginPath();
      ctx.moveTo(this.flagpole.x + 14, this.flagpole.y + 16);
      ctx.lineTo(this.flagpole.x - 18, this.flagpole.y + 32);
      ctx.lineTo(this.flagpole.x + 14, this.flagpole.y + 48);
      ctx.fill();
    }
  }
}