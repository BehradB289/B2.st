/**
 * مدل تنظیمات گرافیک، صدا و کنترل‌های بازی
 */
(function (global) {
  'use strict';

  const Base = typeof BaseModel !== 'undefined'
    ? BaseModel
    : (typeof require !== 'undefined' ? require('./base_model').BaseModel : null);

  const Config = typeof DatabaseConfig !== 'undefined'
    ? DatabaseConfig
    : (typeof require !== 'undefined' ? require('../../../config/database.config').DatabaseConfig : null);

  class SettingsModel extends Base {
    constructor(data = {}) {
      super(data);
      const defaults = Config ? Config.DEFAULT_SETTINGS : {};
      this.id = data.id || defaults.id || 'active_profile_settings';
      this.masterVolume = this._clampVolume(data.masterVolume ?? defaults.masterVolume ?? 0.8);
      this.sfxVolume = this._clampVolume(data.sfxVolume ?? defaults.sfxVolume ?? 0.9);
      this.bgmVolume = this._clampVolume(data.bgmVolume ?? defaults.bgmVolume ?? 0.6);
      this.crtScanlines = data.crtScanlines !== undefined ? Boolean(data.crtScanlines) : true;
      this.screenScale = ['fit', 'pixel-perfect', 'stretch'].includes(data.screenScale) 
        ? data.screenScale 
        : 'fit';

      this.keyBindings = {
        left: data.keyBindings?.left || defaults.keyBindings?.left || 'ArrowLeft',
        right: data.keyBindings?.right || defaults.keyBindings?.right || 'ArrowRight',
        jump: data.keyBindings?.jump || defaults.keyBindings?.jump || 'Space',
        sprint: data.keyBindings?.sprint || defaults.keyBindings?.sprint || 'ShiftLeft',
        duck: data.keyBindings?.duck || defaults.keyBindings?.duck || 'ArrowDown',
        pause: data.keyBindings?.pause || defaults.keyBindings?.pause || 'KeyP'
      };
    }

    _clampVolume(val) {
      const num = Number(val);
      if (isNaN(num)) return 0.5;
      return Math.max(0, Math.min(1, num));
    }

    validate() {
      const errors = [];
      if (this.masterVolume < 0 || this.masterVolume > 1) errors.push('میزان حجم صدای اصلی خارج از محدوده است.');
      return {
        isValid: errors.length === 0,
        errors
      };
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SettingsModel };
  } else {
    global.SettingsModel = SettingsModel;
  }
})(typeof window !== 'undefined' ? window : globalThis);