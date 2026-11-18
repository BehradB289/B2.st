/**
 * مدل جدول رکوردها و امتیازات برتر ماریو (High Score Model)
 */
(function (global) {
  'use strict';

  const Base = typeof BaseModel !== 'undefined'
    ? BaseModel
    : (typeof require !== 'undefined' ? require('./base_model').BaseModel : null);

  const Vault = typeof CryptoVault !== 'undefined'
    ? CryptoVault
    : (typeof require !== 'undefined' ? require('../security/crypto_vault').CryptoVault : null);

  class HighScoreModel extends Base {
    constructor(data = {}) {
      super(data);
      if (data.id !== undefined) {
        this.id = data.id;
      }
      const rawName = data.playerName || 'MARIO';
      this.playerName = Vault ? Vault.sanitize(rawName.toUpperCase(), 12) : rawName.slice(0, 12);
      this.score = Math.max(0, parseInt(data.score || 0, 10));
      this.coins = Math.max(0, parseInt(data.coins || 0, 10));
      this.world = String(data.world || '1-1');
      this.timeRemaining = Math.max(0, parseInt(data.timeRemaining || 0, 10));
    }

    validate() {
      const errors = [];
      if (!this.playerName || this.playerName.length < 2) {
        errors.push('نام بازیکن باید حداقل دارای ۲ کاراکتر باشد.');
      }
      if (this.score <= 0) {
        errors.push('امتیاز ثبت‌شده باید بزرگتر از صفر باشد.');
      }
      return {
        isValid: errors.length === 0,
        errors
      };
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HighScoreModel };
  } else {
    global.HighScoreModel = HighScoreModel;
  }
})(typeof window !== 'undefined' ? window : globalThis);