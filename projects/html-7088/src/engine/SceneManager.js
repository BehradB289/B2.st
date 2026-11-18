/**
 * مدیریت صحنه‌های بازی:
 * ۱) منوی اصلی استودیو B2.st
 * ۲) انتخاب کاراکتر (ماریو، لوئیجی، تود، پرنسس پیچ)
 * ۳) انتخاب مرحله (۱۰ مرحله کامل و اختصاصی)
 * ۴) گیم‌پلی با HUD یکپارچه
 * ۵) توقف (Pause) و پایان بازی / پیروزی
 */
import { Level, LEVELS_CONFIG } from '../levels/LevelData.js';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { PhysicsEngine } from './Physics.js';

export class SceneManager {
  constructor(canvas, input, sound, spriteFactory, particles, camera) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.input = input;
    this.sound = sound;
    this.sprites = spriteFactory;
    this.particles = particles;
    this.camera = camera;

    this.currentScene = 'TITLE'; // TITLE, CHAR_SELECT, LEVEL_SELECT, GAME, PAUSED, GAME_OVER, VICTORY
    this.selectedCharIndex = 0;
    this.selectedLevelIndex = 0;
    this.characters = ['mario', 'luigi', 'toad', 'peach'];

    this.physics = new PhysicsEngine(32);
    this.player = null;
    this.level = null;
    this.enemies = [];
    this.timeLeft = 400;
    this.timerAcc = 0;
  }

  startNewGame(characterId, levelIndex) {
    this.selectedCharIndex = this.characters.indexOf(characterId);
    this.selectedLevelIndex = levelIndex;

    const conf = LEVELS_CONFIG[levelIndex];
    this.level = new Level(conf, 32);
    this.camera.setLevelBounds(this.level.cols * 32, this.level.rows * 32);

    this.player = new Player(64, 300, characterId);
    this.enemies = conf.enemies.map(e => new Enemy(e.x * 32, e.y * 32, e.type));

    this.timeLeft = 400;
    this.particles.clear();
    this.currentScene = 'GAME';

    this.sound.stopBGM();
    this.sound.startBGM(conf.theme);
  }

  update(dt) {
    switch (this.currentScene) {
      case 'TITLE':
        this.updateTitle();
        break;
      case 'CHAR_SELECT':
        this.updateCharSelect();
        break;
      case 'LEVEL_SELECT':
        this.updateLevelSelect();
        break;
      case 'GAME':
        this.updateGame(dt);
        break;
      case 'PAUSED':
        if (this.input.isJustPressed('pause') || this.input.isJustPressed('start')) {
          this.currentScene = 'GAME';
        }
        break;
      case 'GAME_OVER':
      case 'VICTORY':
        if (this.input.isJustPressed('start') || this.input.isJustPressed('jump')) {
          this.currentScene = 'TITLE';
        }
        break;
    }
  }

  updateTitle() {
    if (this.input.isJustPressed('start') || this.input.isJustPressed('jump')) {
      this.sound.init();
      this.sound.playCoin();
      this.currentScene = 'CHAR_SELECT';
    }
  }

  updateCharSelect() {
    if (this.input.isJustPressed('left')) {
      this.selectedCharIndex = (this.selectedCharIndex - 1 + this.characters.length) % this.characters.length;
      this.sound.playJump();
    }
    if (this.input.isJustPressed('right')) {
      this.selectedCharIndex = (this.selectedCharIndex + 1) % this.characters.length;
      this.sound.playJump();
    }
    if (this.input.isJustPressed('start') || this.input.isJustPressed('jump')) {
      this.sound.playPowerup();
      this.currentScene = 'LEVEL_SELECT';
    }
  }

  updateLevelSelect() {
    if (this.input.isJustPressed('left')) {
      this.selectedLevelIndex = (this.selectedLevelIndex - 1 + LEVELS_CONFIG.length) % LEVELS_CONFIG.length;
      this.sound.playJump();
    }
    if (this.input.isJustPressed('right')) {
      this.selectedLevelIndex = (this.selectedLevelIndex + 1) % LEVELS_CONFIG.length;
      this.sound.playJump();
    }
    if (this.input.isJustPressed('start') || this.input.isJustPressed('jump')) {
      this.sound.playPowerup();
      this.startNewGame(this.characters[this.selectedCharIndex], this.selectedLevelIndex);
    }
  }

  updateGame(dt) {
    if (this.input.isJustPressed('pause')) {
      this.currentScene = 'PAUSED';
      return;
    }

    // تایمر بازی
    this.timerAcc += dt;
    if (this.timerAcc >= 1000) {
      this.timeLeft--;
      this.timerAcc -= 1000;
      if (this.timeLeft <= 0) {
        this.player.die(this.sound);
      }
    }

    // آپدیت کاراکتر
    this.player.update(this.input, this.sound, this.particles);
    this.physics.updateEntityX(this.player, this.level);
    this.physics.updateEntityY(this.player, this.level);

    // آپدیت دوربین
    this.camera.update(this.player);

    // آپدیت دشمنان و بررسی تصادفات
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.update(this.physics, this.level);

      if (e.remove) {
        this.enemies.splice(i, 1);
        continue;
      }

      // تصادم با بازیکن
      if (!this.player.isDead && PhysicsEngine.checkAABB(this.player, e)) {
        // آیا ماریو روی سر دشمن فرود آمده؟
        if (this.player.vy > 0 && (this.player.y + this.player.height - this.player.vy) <= e.y + 14) {
          e.stomp(this.player, this.sound, this.particles);
        } else {
          // در غیر این صورت بازیکن صدمه می‌بیند
          if (!e.isDead) {
            this.player.die(this.sound);
          }
        }
      }
    }

    // بررسی رسیدن به میله پرچم پایان مرحله
    if (this.level.flagpole && !this.player.won) {
      const flagBounds = {
        x: this.level.flagpole.x,
        y: this.level.flagpole.y,
        width: 32,
        height: this.level.flagpole.height
      };
      if (PhysicsEngine.checkAABB(this.player, flagBounds)) {
        this.player.won = true;
        this.sound.stopBGM();
        this.sound.playStageClear();
        setTimeout(() => {
          if (this.selectedLevelIndex + 1 < LEVELS_CONFIG.length) {
            this.startNewGame(this.characters[this.selectedCharIndex], this.selectedLevelIndex + 1);
          } else {
            this.currentScene = 'VICTORY';
          }
        }, 3200);
      }
    }

    // در صورت مرگ
    if (this.player.isDead && this.player.y > 650) {
      if (this.player.lives > 0) {
        this.startNewGame(this.characters[this.selectedCharIndex], this.selectedLevelIndex);
      } else {
        this.currentScene = 'GAME_OVER';
      }
    }

    this.particles.update();
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    switch (this.currentScene) {
      case 'TITLE':
        this.drawTitle();
        break;
      case 'CHAR_SELECT':
        this.drawCharSelect();
        break;
      case 'LEVEL_SELECT':
        this.drawLevelSelect();
        break;
      case 'GAME':
      case 'PAUSED':
        this.drawGame();
        if (this.currentScene === 'PAUSED') this.drawPauseOverlay();
        break;
      case 'GAME_OVER':
        this.drawGameOver();
        break;
      case 'VICTORY':
        this.drawVictory();
        break;
    }
  }

  drawTitle() {
    this.ctx.fillStyle = '#0a0a14';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // عنوان اصلی سبک رترو
    this.ctx.fillStyle = '#ff2222';
    this.ctx.font = 'bold 42px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('SUPER MARIO', this.canvas.width / 2, 130);

    this.ctx.fillStyle = '#ffcc00';
    this.ctx.font = 'bold 20px monospace';
    this.ctx.fillText('B2 STUDIO ADVANCED ENGINE', this.canvas.width / 2, 175);

    // کادر جزئیات
    this.ctx.strokeStyle = '#383860';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(120, 210, this.canvas.width - 240, 160);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '16px monospace';
    this.ctx.fillText('شامل ۴ قهرمان با فیزیک و انیمیشن ویژه', this.canvas.width / 2, 255);
    this.ctx.fillText('۱۰ مرحله غنی و دست‌چین شده با تم‌های متنوع', this.canvas.width / 2, 290);
    this.ctx.fillText('موتور سنتز صوتی ۸ بیتی و خطوط اسکن CRT', this.canvas.width / 2, 325);

    // متن چشمک زن شروع
    if (Math.floor(Date.now() / 500) % 2 === 0) {
      this.ctx.fillStyle = '#00ffcc';
      this.ctx.font = 'bold 20px monospace';
      this.ctx.fillText('برای ورود ENTER یا Z را فشار دهید', this.canvas.width / 2, 420);
    }
  }

  drawCharSelect() {
    this.ctx.fillStyle = '#141424';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = '#ffcc00';
    this.ctx.font = 'bold 28px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('قهرمان خود را انتخاب کنید', this.canvas.width / 2, 60);

    const charList = [
      { id: 'mario', name: 'MARIO', color: '#ff2222', desc: 'متعادل در کنترل و شتاب' },
      { id: 'luigi', name: 'LUIGI', color: '#00cc22', desc: 'پرش بلندتر + لغزندگی بیشتر' },
      { id: 'toad',  name: 'TOAD',  color: '#0077ff', desc: 'سرعت دویدن خارق‌العاده' },
      { id: 'peach', name: 'PEACH', color: '#ff88bb', desc: 'قابلیت هاور و شناوری در هوا' }
    ];

    const boxWidth = 140;
    const spacing = 36;
    const totalW = charList.length * boxWidth + (charList.length - 1) * spacing;
    const startX = (this.canvas.width - totalW) / 2;

    charList.forEach((c, idx) => {
      const bx = startX + idx * (boxWidth + spacing);
      const by = 110;
      const isSelected = idx === this.selectedCharIndex;

      // هایلایت کادر
      this.ctx.fillStyle = isSelected ? '#2b2b48' : '#1c1c2e';
      this.ctx.fillRect(bx, by, boxWidth, 220);

      this.ctx.strokeStyle = isSelected ? '#ffcc00' : '#444466';
      this.ctx.lineWidth = isSelected ? 4 : 2;
      this.ctx.strokeRect(bx, by, boxWidth, 220);

      // رسم اسپرایت کاراکتر در ابعاد بزرگ
      const spr = this.sprites.getCharacterSprite(c.id, 0, 1);
      this.ctx.drawImage(spr, bx + boxWidth / 2 - 32, by + 30, 64, 80);

      // نام
      this.ctx.fillStyle = c.color;
      this.ctx.font = 'bold 18px monospace';
      this.ctx.fillText(c.name, bx + boxWidth / 2, by + 145);

      // فلش نشانگر
      if (isSelected) {
        this.ctx.fillStyle = '#ffcc00';
        this.ctx.fillText('▲', bx + boxWidth / 2, by + 200);
      }
    });

    // توضیحات کاراکتر انتخاب شده
    const active = charList[this.selectedCharIndex];
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '16px monospace';
    this.ctx.fillText(active.desc, this.canvas.width / 2, 380);

    this.ctx.fillStyle = '#aaaaaa';
    this.ctx.font = '13px monospace';
    this.ctx.fillText('کلیدهای جهت‌نما ← → برای جابجایی | کلید Z یا ENTER برای تایید', this.canvas.width / 2, 430);
  }

  drawLevelSelect() {
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = '#38bdf8';
    this.ctx.font = 'bold 26px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('انتخاب مرحله از میان ۱۰ دنیا', this.canvas.width / 2, 50);

    // نمایش گرید ۲ سطری از ۱۰ مرحله
    const rows = 2;
    const cols = 5;
    const cardW = 120;
    const cardH = 110;
    const gapX = 22;
    const gapY = 25;
    const startX = (this.canvas.width - (cols * cardW + (cols - 1) * gapX)) / 2;
    const startY = 95;

    LEVELS_CONFIG.forEach((lvl, idx) => {
      const r = Math.floor(idx / cols);
      const c = idx % cols;
      const x = startX + c * (cardW + gapX);
      const y = startY + r * (cardH + gapY);
      const isSel = idx === this.selectedLevelIndex;

      this.ctx.fillStyle = isSel ? '#1e293b' : '#0f172a';
      this.ctx.fillRect(x, y, cardW, cardH);

      this.ctx.strokeStyle = isSel ? '#f59e0b' : '#334155';
      this.ctx.lineWidth = isSel ? 3 : 1.5;
      this.ctx.strokeRect(x, y, cardW, cardH);

      this.ctx.fillStyle = isSel ? '#f59e0b' : '#94a3b8';
      this.ctx.font = 'bold 16px monospace';
      this.ctx.fillText(`STAGE ${lvl.id}`, x + cardW / 2, y + 38);

      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '11px monospace';
      const shortName = lvl.name.split(' ')[1] || lvl.name;
      this.ctx.fillText(shortName, x + cardW / 2, y + 68);

      if (isSel) {
        this.ctx.fillStyle = '#f59e0b';
        this.ctx.fillText('★ انتخاب شده', x + cardW / 2, y + 94);
      }
    });

    const curr = LEVELS_CONFIG[this.selectedLevelIndex];
    this.ctx.fillStyle = '#38bdf8';
    this.ctx.font = 'bold 16px monospace';
    this.ctx.fillText(`مرحله انتخابی: ${curr.name}`, this.canvas.width / 2, 385);

    this.ctx.fillStyle = '#94a3b8';
    this.ctx.font = '13px monospace';
    this.ctx.fillText('جهت‌نماها: تغییر مرحله | ENTER یا Z: پرش به بازی', this.canvas.width / 2, 430);
  }

  drawGame() {
    // پس‌زمینه آسمان مرحله
    this.ctx.fillStyle = this.level.config.bgColor || '#5c94fc';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // اعمال تبدیل دوربین
    this.camera.apply(this.ctx);

    // رسم مرحله و تایل‌ها
    this.level.draw(this.ctx, this.sprites, this.camera);

    // رسم دشمنان
    for (const e of this.enemies) {
      e.draw(this.ctx);
    }

    // رسم بازیکن
    this.player.draw(this.ctx, this.sprites);

    // رسم ذرات
    this.particles.draw(this.ctx);

    // بازگرداندن مختصات دوربین
    this.camera.restore(this.ctx);

    // رسم کامل نوار ابزار و HUD در بالای تصویر
    this.drawHUD();
  }

  drawHUD() {
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 14px monospace';
    this.ctx.textAlign = 'left';

    // امتیاز و کاراکتر
    const pName = this.player.characterId.toUpperCase();
    this.ctx.fillText(`${pName}`, 24, 25);
    this.ctx.fillText(String(this.player.score).padStart(6, '0'), 24, 45);

    // سکه‌ها
    this.ctx.fillStyle = '#ffcc00';
    this.ctx.fillText(`● x${String(this.player.coins).padStart(2, '0')}`, 220, 45);

    // دنیا و مرحله جاری
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText('WORLD', 420, 25);
    this.ctx.fillText(`${LEVELS_CONFIG[this.selectedLevelIndex].id}`, 435, 45);

    // زمان باقی‌مانده
    this.ctx.fillText('TIME', 610, 25);
    this.ctx.fillText(String(Math.max(0, this.timeLeft)).padStart(3, '0'), 618, 45);

    // جان‌ها
    this.ctx.fillStyle = '#ff4444';
    this.ctx.fillText(`♥ x${this.player.lives}`, 700, 45);
  }

  drawPauseOverlay() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 36px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2 - 10);

    this.ctx.font = '16px monospace';
    this.ctx.fillStyle = '#ffcc00';
    this.ctx.fillText('برای ادامه کلید ESC یا ENTER را بزنید', this.canvas.width / 2, this.canvas.height / 2 + 35);
  }

  drawGameOver() {
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = '#ff2222';
    this.ctx.font = 'bold 44px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 20);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '16px monospace';
    this.ctx.fillText('برای بازگشت به منوی شروع کلید ENTER را فشار دهید', this.canvas.width / 2, this.canvas.height / 2 + 40);
  }

  drawVictory() {
    this.ctx.fillStyle = '#001a33';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = '#ffd700';
    this.ctx.font = 'bold 38px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('★ پیروزی نهایی! تبریک! ★', this.canvas.width / 2, 140);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '18px monospace';
    this.ctx.fillText('شما با موفقیت تمامی ۱۰ مرحله را به پایان رساندید!', this.canvas.width / 2, 210);
    this.ctx.fillText(`امتیاز نهایی کسب شده: ${this.player?.score || 0}`, this.canvas.width / 2, 255);

    this.ctx.fillStyle = '#00ffcc';
    this.ctx.font = '15px monospace';
    this.ctx.fillText('طراحی و پیاده‌سازی شده در استودیو بین‌المللی B2.st', this.canvas.width / 2, 330);
    this.ctx.fillText('برای شروع مجدد ENTER را بزنید', this.canvas.width / 2, 400);
  }
}