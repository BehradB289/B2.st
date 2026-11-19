/**
 * @file settings.default.js
 * @description تنظیمات و پیکربندی پیش‌فرض برای اولین اجرای بازی
 */

export const DEFAULT_GAME_SETTINGS = {
  id: 'system_settings',
  masterVolume: 0.8,
  sfxVolume: 0.9,
  musicVolume: 0.7,
  crtFilterEnabled: true,
  pixelScale: 3,
  keyBindings: {
    UP: 'ArrowUp',
    DOWN: 'ArrowDown',
    LEFT: 'ArrowLeft',
    RIGHT: 'ArrowRight',
    JUMP: 'KeyZ',
    RUN_SHOOT: 'KeyX',
    PAUSE: 'Enter'
  }
};