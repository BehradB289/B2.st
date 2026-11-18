import { Camera } from './engine/Camera.js';
import { Physics } from './engine/Physics.js';
import { GameLoop } from './engine/GameLoop.js';
import { Input } from './engine/Input.js';
import { sound } from './engine/Audio.js';
import { Mario } from './entities/Mario.js';
import { World1_1 } from './levels/World1_1.js';

/**
 * مدیر اصلی جریان بازی و ارتباط‌دهنده لایه‌ها
 */
class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    // رزولوشن مادری رترو کنسول NES: 256x240
    this.virtualWidth = 256;
    this.virtualHeight = 240;

    this.score = 0;
    this.coins = 0;
    this.time = 400;
    this.timeCounter = 0;

    this.input = new Input();
    this.physics = new Physics();
    this.camera = new Camera(this.virtualWidth, this.virtualHeight);

    this.tileMap = World1_1.create();
    this.mario = new Mario(40, 180);

    this.camera.setBounds(0, this.tileMap.cols * this.tileMap.tileSize);

    this.updateHUD();
    this.initUserInteraction();

    this.loop = new GameLoop(this.update.bind(this), this.render.bind(this));
    this.loop.start();
  }

  initUserInteraction() {
    // باز کردن قفل صوتی مرورگر با نخستین کلیک یا فشردن دکمه
    const unlockAudio = () => {
      sound.init();
      window.removeEventListener('keydown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('mousedown', unlockAudio);
    };
    window.addEventListener('keydown', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);
    window.addEventListener('mousedown', unlockAudio);

    // کنترل‌های لمسی موبایل
    this.bindTouchButton('btn-left', 'ArrowLeft');
    this.bindTouchButton('btn-right', 'ArrowRight');
    this.bindTouchButton('btn-jump', 'KeyZ');
    this.bindTouchButton('btn-run', 'KeyX');
  }

  bindTouchButton(elementId, keyCode) {
    const btn = document.getElementById(elementId);
    if (!btn) return;

    btn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.input.handleKey(keyCode, true);
    });
    btn.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.input.handleKey(keyCode, false);
    });
  }

  addScore(pts) {
    this.score += pts;
    this.updateHUD();
  }

  addCoin() {
    this.coins += 1;
    this.updateHUD();
  }

  updateHUD() {
    const scoreEl = document.getElementById('hud-score');
    const coinsEl = document.getElementById('hud-coins');
    const timeEl = document.getElementById('hud-time');

    if (scoreEl) scoreEl.textContent = this.score.toString().padStart(6, '0');
    if (coinsEl) coinsEl.textContent = `🪙x${this.coins.toString().padStart(2, '0')}`;
    if (timeEl) timeEl.textContent = Math.ceil(this.time).toString().padStart(3, '0');
  }

  update(dt) {
    // شمارنده زمان رترو
    this.timeCounter += dt;
    if (this.timeCounter >= 0.4) {
      this.time = Math.max(0, this.time - 1);
      this.timeCounter = 0;
      this.updateHUD();
    }

    // ورودی و فیزیک ماریو
    this.mario.handleInput(this.input, dt);
    this.physics.applyGravity(this.mario, dt);

    // حل برخورد ماریو با تایل‌مپ و تحریک بلوک‌ها
    const gameContext = {
      addScore: this.addScore.bind(this),
      addCoin: this.addCoin.bind(this)
    };
    this.physics.resolveEntityTileMap(this.mario, this.tileMap, this.camera, dt);
    this.mario.updateAnimation(dt);

    // بروزرسانی انیمیشن‌های تایل‌مپ و ذرات خرد شده آجر
    this.tileMap.update(dt);

    // ردیابی و همگام‌سازی دوربین با ماریو
    this.camera.follow(this.mario);

    // بازنشانی ایمپالس جهش ورودی
    this.input.resetJumpPressed();

    // بررسی سقوط در چاله
    if (this.mario.pos.y > this.virtualHeight + 32) {
      this.respawnMario();
    }
  }

  respawnMario() {
    this.mario.pos.set(Math.max(40, this.camera.x + 20), 100);
    this.mario.vel.set(0, 0);
  }

  render() {
    // ۱. پاکسازی پس‌زمینه با رنگ آبی آسمان کلاسیک NES (#5c94fc)
    this.ctx.fillStyle = '#5c94fc';
    this.ctx.fillRect(0, 0, this.virtualWidth, this.virtualHeight);

    // ۲. اعمال ماتریس تغییر دید دوربین
    this.ctx.save();
    this.camera.apply(this.ctx);

    // ۳. رندر تایل‌مپ به همراه Viewport Culling
    this.tileMap.render(this.ctx, this.camera);

    // ۴. رندر کاراکتر ماریو
    this.mario.render(this.ctx);

    this.ctx.restore();
  }
}

// راه‌اندازی پس از بارگذاری کامل DOM
window.addEventListener('DOMContentLoaded', () => {
  new Game();
});