/**
 * Application Bootstrap & DOM Interfacing
 * Studio: B2.st
 */

import { CONFIG } from '../config/game_config.js';
import { Game } from './engine/game.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');
  canvas.width = CONFIG.CANVAS.WIDTH;
  canvas.height = CONFIG.CANVAS.HEIGHT;

  const game = new Game(canvas);
  game.loop.start();

  // Cache & Engine Telemetry Monitor
  const fpsDisplay = document.getElementById('fpsValue');
  const cacheHitDisplay = document.getElementById('cacheHitRate');
  const cacheSizeDisplay = document.getElementById('cacheSize');

  setInterval(() => {
    if (fpsDisplay) fpsDisplay.textContent = game.loop.fps;
    const stats = game.getCacheMetrics();
    if (cacheHitDisplay) cacheHitDisplay.textContent = `${stats.hitRate}%`;
    if (cacheSizeDisplay) cacheSizeDisplay.textContent = `${stats.size} items`;
  }, 500);

  // User Action Bindings
  const restartBtn = document.getElementById('btnRestart');
  if (restartBtn) {
    restartBtn.addEventListener('click', () => game.restart());
  }

  const soundBtn = document.getElementById('btnSound');
  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      const isSoundOn = game.sound.toggleSound();
      soundBtn.textContent = isSoundOn ? '🔊 Audio ON' : '🔇 Audio OFF';
    });
  }

  const pauseBtn = document.getElementById('btnPause');
  if (pauseBtn) {
    pauseBtn.addEventListener('click', () => game.togglePause());
  }

  // Click canvas to dismiss START screen or resume
  canvas.addEventListener('click', () => {
    if (game.state === 'START' || game.state === 'GAME_OVER') {
      game.start();
    }
  });

  // Touch Controller Bindings for Mobile Screen
  const setupTouchBtn = (id, keyName) => {
    const el = document.getElementById(id);
    if (!el) return;

    const startHandler = (e) => {
      e.preventDefault();
      if (game.state === 'START' || game.state === 'GAME_OVER') {
        game.start();
      }
      game.input.keys[keyName] = true;
      if (keyName === 'jump') {
        game.input.jumpPressed = true;
      }
    };

    const endHandler = (e) => {
      e.preventDefault();
      game.input.keys[keyName] = false;
    };

    el.addEventListener('touchstart', startHandler, { passive: false });
    el.addEventListener('touchend', endHandler, { passive: false });
    el.addEventListener('mousedown', startHandler);
    el.addEventListener('mouseup', endHandler);
  };

  setupTouchBtn('touchLeft', 'left');
  setupTouchBtn('touchRight', 'right');
  setupTouchBtn('touchDown', 'down');
  setupTouchBtn('touchJump', 'jump');
  setupTouchBtn('touchRun', 'run');
});