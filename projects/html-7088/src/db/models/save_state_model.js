/**
 * مدل داده‌ای فایل ذخیره پیشرفت مرحله (Mario SaveState Model)
 */
(function (global) {
  'use strict';

  const Base = typeof BaseModel !== 'undefined'
    ? BaseModel
    : (typeof require !== 'undefined' ? require('./base_model').BaseModel : null);

  const Vault = typeof CryptoVault !== 'undefined'
    ? CryptoVault
    : (typeof require !== 'undefined' ? require('../security/crypto_vault').CryptoVault : null);

  class SaveStateModel extends Base {
    constructor(data = {}) {
      super(data);

      this.slotId = String(data.slotId || 'slot_1');
      this.label = Vault ? Vault.sanitize(data.label || `World 1-1 - AutoSave`, 32) : (data.label || 'SaveSlot');

      // موقعیت و فیزیک کاراکتر ماریو
      this.mario = {
        x: Number.isFinite(data.mario?.x) ? data.mario.x : 40,
        y: Number.isFinite(data.mario?.y) ? data.mario.y : 180,
        vx: Number.isFinite(data.mario?.vx) ? data.mario.vx : 0,
        vy: Number.isFinite(data.mario?.vy) ? data.mario.vy : 0,
        powerState: data.mario?.powerState || 'small', // 'small' | 'super' | 'fire'
        isGrounded: Boolean(data.mario?.isGrounded),
        facingRight: data.mario?.facingRight !== false
      };

      // آمار مرحله و بازی
      this.stats = {
        score: Math.max(0, parseInt(data.stats?.score || 0, 10)),
        coins: Math.max(0, parseInt(data.stats?.coins || 0, 10)),
        lives: Math.max(0, parseInt(data.stats?.lives ?? 3, 10)),
        world: String(data.stats?.world || '1'),
        level: String(data.stats?.level || '1'),
        timeRemaining: Math.max(0, parseInt(data.stats?.timeRemaining ?? 400, 10))
      };

      // متغیرهای جهان بازی (بلاک‌های تخریب شده، دشمنان مغلوب شده)
      this.worldState = {
        defeatedEnemies: Array.isArray(data.worldState?.defeatedEnemies) ? [...data.worldState.defeatedEnemies] : [],
        collectedCoins: Array.isArray(data.worldState?.collectedCoins) ? [...data.worldState.collectedCoins] : [],
        openedBlocks: Array.isArray(data.worldState?.openedBlocks) ? [...data.worldState.openedBlocks] : []
      };

      if (data.signature) {
        this.signature = data.signature;
      }
    }

    validate() {
      const errors = [];
      if (!this.slotId) errors.push('شناسه اسلات ذخیره (slotId) الزامی است.');
      if (this.stats.lives < 0 || this.stats.lives > 99) errors.push('تعداد جان‌های ماریو نامعتبر است.');
      if (this.stats.score < 0) errors.push('امتیاز ذخیره شده نمی‌تواند منفی باشد.');
      if (this.stats.coins < 0) errors.push('تعداد سکه‌ها نامعتبر است.');
      if (!['small', 'super', 'fire'].includes(this.mario.powerState)) {
        errors.push('وضعیت قدرت کاراکتر نامعتبر است.');
      }
      return {
        isValid: errors.length === 0,
        errors
      };
    }

    /**
     * ساخت مدل از وضعیت فعال آبجکت بازی
     */
    static fromGameState(slotId, label, marioEntity, gameStats, worldTracker = {}) {
      return new SaveStateModel({
        slotId,
        label,
        mario: {
          x: marioEntity.position.x,
          y: marioEntity.position.y,
          vx: marioEntity.velocity.x,
          vy: marioEntity.velocity.y,
          powerState: marioEntity.powerState,
          isGrounded: marioEntity.isGrounded,
          facingRight: marioEntity.facingRight
        },
        stats: {
          score: gameStats.score,
          coins: gameStats.coins,
          lives: gameStats.lives,
          world: gameStats.world,
          level: gameStats.level,
          timeRemaining: gameStats.timeRemaining
        },
        worldState: {
          defeatedEnemies: worldTracker.defeatedEnemies || [],
          collectedCoins: worldTracker.collectedCoins || [],
          openedBlocks: worldTracker.openedBlocks || []
        }
      });
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SaveStateModel };
  } else {
    global.SaveStateModel = SaveStateModel;
  }
})(typeof window !== 'undefined' ? window : globalThis);