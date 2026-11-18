/**
 * تعریف ماتریس مرحله ۱-۱، کاشی‌های تعاملی، جعبه‌های سوپر قارچ، سکه‌ها و پرچم پایان
 */
(function (global) {
  'use strict';

  class Level1_1 {
    constructor() {
      this.width = 2400;
      this.height = 240;
      this.tileSize = 16;
      this.tiles = [];
      this.questionBlocks = [];
      this.pipes = [];
      this.flagPole = { x: 2150, y: 36, width: 6, height: 160 };
      this.initLevel();
    }

    initLevel() {
      // ۱. ایجاد زمین صاف با چاله در فواصل معین
      for (let x = 0; x < this.width; x += this.tileSize) {
        // ایجاد چاله‌ها (Pits)
        if ((x >= 800 && x < 848) || (x >= 1200 && x < 1264)) {
          continue;
        }
        // ردیف اول و دوم زمین
        this.tiles.push({ x, y: 208, width: 16, height: 16, type: 'ground' });
        this.tiles.push({ x, y: 224, width: 16, height: 16, type: 'ground' });
      }

      // ۲. بلوک‌های علامت سوال سکه دار و قارچ
      const qBlockCoords = [
        { x: 256, y: 144, content: 'coin' },
        { x: 336, y: 144, content: 'powerup' },
        { x: 368, y: 144, content: 'coin' },
        { x: 352, y: 80, content: 'coin' },
        { x: 960, y: 144, content: 'powerup' },
        { x: 1040, y: 80, content: 'coin' },
        { x: 1480, y: 144, content: 'coin' }
      ];

      for (const qb of qBlockCoords) {
        this.questionBlocks.push({
          x: qb.x,
          y: qb.y,
          width: 16,
          height: 16,
          type: 'question',
          content: qb.content,
          isHit: false,
          bumpOffset: 0
        });
      }

      // ۳. بلوک‌های آجری
      const brickCoords = [
        { x: 320, y: 144 }, { x: 352, y: 144 }, { x: 384, y: 144 },
        { x: 944, y: 144 }, { x: 976, y: 144 },
        { x: 1464, y: 144 }, { x: 1496, y: 144 }
      ];
      for (const b of brickCoords) {
        this.tiles.push({ x: b.x, y: b.y, width: 16, height: 16, type: 'brick' });
      }

      // ۴. لوله‌های سبز (Pipes)
      const pipeCoords = [
        { x: 448, y: 176, height: 32 },
        { x: 608, y: 160, height: 48 },
        { x: 736, y: 144, height: 64 },
        { x: 1640, y: 176, height: 32 }
      ];
      for (const p of pipeCoords) {
        this.pipes.push({ x: p.x, y: p.y, width: 32, height: p.height, type: 'pipe' });
      }
    }

    getSolidTilesInBox(box, tileSize = 16) {
      const solids = [];

      // کاشی‌های معمولی و آجرها
      for (const t of this.tiles) {
        if (box.left < t.x + t.width && box.right > t.x &&
            box.top < t.y + t.height && box.bottom > t.y) {
          solids.push({ top: t.y, bottom: t.y + t.height, left: t.x, right: t.x + t.width });
        }
      }

      // لوله‌ها
      for (const p of this.pipes) {
        if (box.left < p.x + p.width && box.right > p.x &&
            box.top < p.y + p.height && box.bottom > p.y) {
          solids.push({ top: p.y, bottom: p.y + p.height, left: p.x, right: p.x + p.width });
        }
      }

      // بلوک‌های علامت سوال
      for (const q of this.questionBlocks) {
        if (box.left < q.x + q.width && box.right > q.x &&
            box.top < q.y + q.height && box.bottom > q.y) {
          solids.push({
            top: q.y,
            bottom: q.y + q.height,
            left: q.x,
            right: q.x + q.width,
            onHit: (entity) => {
              if (!q.isHit) {
                q.isHit = true;
                q.bumpOffset = -4;
                if (q.content === 'coin' && this.onCoinCollect) this.onCoinCollect();
                if (q.content === 'powerup' && this.onPowerupSpawn) this.onPowerupSpawn(q.x, q.y - 16);
              }
            }
          });
        }
      }

      return solids;
    }

    render(ctx, camera) {
      // پس‌زمینه ابر و تپه رترو
      ctx.fillStyle = '#6888fc'; // رنگ آسمان آبی روشن NES
      ctx.fillRect(0, 0, camera.viewportWidth, camera.viewportHeight);

      // رسم کاشی‌های زمین و آجر
      for (const t of this.tiles) {
        const sx = Math.round(t.x - camera.x);
        if (sx < -16 || sx > camera.viewportWidth) continue;

        if (t.type === 'ground') {
          ctx.fillStyle = '#c84c0c'; // قهوه‌ای آجری NES
          ctx.fillRect(sx, t.y, t.width, t.height);
          ctx.fillStyle = '#fcb088';
          ctx.fillRect(sx, t.y, t.width, 2);
          ctx.fillStyle = '#000000';
          ctx.strokeRect(sx, t.y, t.width, t.height);
        } else if (t.type === 'brick') {
          ctx.fillStyle = '#b84418';
          ctx.fillRect(sx, t.y, t.width, t.height);
          ctx.fillStyle = '#000000';
          ctx.strokeRect(sx, t.y, t.width, t.height);
        }
      }

      // رسم لوله‌ها
      for (const p of this.pipes) {
        const sx = Math.round(p.x - camera.x);
        if (sx < -32 || sx > camera.viewportWidth) continue;

        ctx.fillStyle = '#00a800'; // سبز نمادین نینتندو
        ctx.fillRect(sx, p.y, p.width, p.height);
        ctx.fillStyle = '#80d010';
        ctx.fillRect(sx + 2, p.y, 4, p.height);
        ctx.fillStyle = '#000000';
        ctx.strokeRect(sx, p.y, p.width, p.height);
      }

      // رسم بلوک‌های علامت سوال
      for (const q of this.questionBlocks) {
        const sx = Math.round(q.x - camera.x);
        if (sx < -16 || sx > camera.viewportWidth) continue;

        if (q.bumpOffset < 0) q.bumpOffset += 0.5;

        const sy = q.y + q.bumpOffset;
        if (q.isHit) {
          ctx.fillStyle = '#8c7040';
          ctx.fillRect(sx, sy, q.width, q.height);
        } else {
          ctx.fillStyle = '#fc9838'; // طلایی/نارنجی
          ctx.fillRect(sx, sy, q.width, q.height);
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 11px monospace';
          ctx.fillText('?', sx + 4, sy + 12);
        }
        ctx.strokeStyle = '#000000';
        ctx.strokeRect(sx, sy, q.width, q.height);
      }

      // رسم میله پرچم پایان مرحله
      const flagX = Math.round(this.flagPole.x - camera.x);
      if (flagX >= -20 && flagX <= camera.viewportWidth) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(flagX, this.flagPole.y, this.flagPole.width, this.flagPole.height);
        ctx.fillStyle = '#00a800';
        ctx.fillRect(flagX - 18, this.flagPole.y + 10, 18, 12); // پرچم سبز
      }
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Level1_1 };
  } else {
    global.Level1_1 = Level1_1;
  }
})(typeof window !== 'undefined' ? window : globalThis);