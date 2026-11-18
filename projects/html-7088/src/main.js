/**
 * نقطه ورود اصلی برنامه: راه‌اندازی ساب‌سیستم‌ها، مدیریت افکت CRT و اتصال رویدادها
 */
import { InputHandler } from './engine/Input.js';
import { SoundEngine } from './engine/Audio.js';
import { Camera } from './engine/Camera.js';
import { ParticleSystem } from './engine/Particles.js';
import { SpriteFactory } from './entities/SpriteSheet.js';
import { SceneManager } from './engine/SceneManager.js';
import { GameLoop } from './engine/GameLoop.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');
  const crtOverlay = document.getElementById('crtOverlay');

  const input = new InputHandler();
  const sound = new SoundEngine();
  const camera = new Camera(canvas.width, canvas.height);
  const particles = new ParticleSystem();
  const spriteFactory = new SpriteFactory();

  const sceneManager = new SceneManager(
    canvas,
    input,
    sound,
    spriteFactory,
    particles,
    camera
  );

  // تغییر وضعیت افکت CRT با فشردن کلید C
  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyC') {
      if (crtOverlay) {
        crtOverlay.style.display = crtOverlay.style.display === 'none' ? 'block' : 'none';
      }
    }
  });

  const gameLoop = new GameLoop(
    (dt) => {
      sceneManager.update(dt);
      input.update();
    },
    () => {
      sceneManager.render();
    }
  );

  gameLoop.start();
  console.log('%c★ B2.st Mario Advanced Engine Loaded Successfully ★', 'color: #ffcc00; font-weight: bold; font-size: 14px;');
});