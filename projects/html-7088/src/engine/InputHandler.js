import { EventEmitter } from './EventEmitter.js';

/**
 * کلیدهای پیش‌فرض نگاشت‌شده به اکشن‌های بازی ماریو
 */
export const DEFAULT_KEY_BINDINGS = {
  // حرکت افقی
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',

  // جهت‌های بالا / پایین
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowUp: 'up',
  KeyW: 'up',

  // پرش (Jump)
  Space: 'jump',
  KeyZ: 'jump',

  // دویدن سریع / شلیک (Run / Fireball)
  KeyX: 'run',
  ShiftLeft: 'run',
  ShiftRight: 'run',

  // کنترل چرخه بازی
  Escape: 'pause',
  KeyP: 'pause',
  Enter: 'start'
};

/**
 * InputHandler - مدیریت ورودی‌های صفحه‌کلید، فریم‌های دکمه و نگاشت اکشن‌ها
 */
export class InputHandler extends EventEmitter {
  /**
   * @param {Object} [bindings=DEFAULT_KEY_BINDINGS] نگاشت کلیدها
   * @param {EventTarget} [target=null] المان گوش‌دهنده به رویداد (مانند window)
   */
  constructor(bindings = DEFAULT_KEY_BINDINGS, target = null) {
    super();
    this.bindings = { ...bindings };
    this.target = target;

    // نگهداری وضعیت فشرده بودن فعلی کلیدها و اکشن‌ها
    /** @type {Set<string>} کلیدهای فیزیکی در حال حاضر فشرده‌شده */
    this.rawKeysDown = new Set();

    /** @type {Map<string, boolean>} اکشن‌های در حال فشرده بودن */
    this.actions = new Map();

    /** @type {Set<string>} اکشن‌هایی که دقیقاً در همین فریم فشرده شده‌اند */
    this.justPressedActions = new Set();

    /** @type {Set<string>} اکشن‌هایی که دقیقاً در همین فریم رها شده‌اند */
    this.justReleasedActions = new Set();

    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onBlur = this.onBlur.bind(this);

    if (this.target) {
      this.bindEvents(this.target);
    }
  }

  /**
   * اتصال شنوندگان DOM به المان هدف
   * @param {EventTarget} target
   */
  bindEvents(target) {
    this.unbindEvents();
    this.target = target;
    this.target.addEventListener('keydown', this.onKeyDown);
    this.target.addEventListener('keyup', this.onKeyUp);
    if (typeof window !== 'undefined') {
      window.addEventListener('blur', this.onBlur);
    }
  }

  /**
   * قطع اتصال شنوندگان
   */
  unbindEvents() {
    if (!this.target) return;
    this.target.removeEventListener('keydown', this.onKeyDown);
    this.target.removeEventListener('keyup', this.onKeyUp);
    if (typeof window !== 'undefined') {
      window.removeEventListener('blur', this.onBlur);
    }
    this.target = null;
  }

  /**
   * رویداد فشرده شدن کلید
   * @param {KeyboardEvent} event
   */
  onKeyDown(event) {
    const code = event.code;
    const action = this.bindings[code];

    // در صورت وجود اکشن مربوط به بازی، از اسکرول پیش‌فرض مرورگر جلوگیری شود
    if (action) {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) {
        event.preventDefault();
      }
    }

    if (!this.rawKeysDown.has(code)) {
      this.rawKeysDown.add(code);

      if (action) {
        const wasActive = this.actions.get(action) || false;
        this.actions.set(action, true);

        if (!wasActive) {
          this.justPressedActions.add(action);
          this.emit('actionDown', { action, code });
        }
      }
    }
  }

  /**
   * رویداد رها شدن کلید
   * @param {KeyboardEvent} event
   */
  onKeyUp(event) {
    const code = event.code;
    const action = this.bindings[code];

    if (this.rawKeysDown.has(code)) {
      this.rawKeysDown.delete(code);

      if (action) {
        // بررسی این‌که آیا کلید دیگری همچنان همین اکشن را فعال نگه داشته است یا خیر
        const stillActive = Array.from(this.rawKeysDown).some(
          (otherCode) => this.bindings[otherCode] === action
        );

        if (!stillActive) {
          this.actions.set(action, false);
          this.justReleasedActions.add(action);
          this.emit('actionUp', { action, code });
        }
      }
    }
  }

  /**
   * هنگام از دست رفتن فوکوس تب، برای جلوگیری از قفل شدن کلیدها وضعیت ریست می‌شود
   */
  onBlur() {
    this.rawKeysDown.clear();
    for (const action of this.actions.keys()) {
      if (this.actions.get(action)) {
        this.justReleasedActions.add(action);
      }
      this.actions.set(action, false);
    }
  }

  /**
   * آیا اکشن مشخصی هم‌اکنون فشرده است؟
   * @param {string} action
   * @returns {boolean}
   */
  isDown(action) {
    return !!this.actions.get(action);
  }

  /**
   * آیا اکشن در همین فریم جدیداً فشرده شده است؟
   * @param {string} action
   * @returns {boolean}
   */
  isJustPressed(action) {
    return this.justPressedActions.has(action);
  }

  /**
   * آیا اکشن در همین فریم جدیداً رها شده است؟
   * @param {string} action
   * @returns {boolean}
   */
  isJustReleased(action) {
    return this.justReleasedActions.has(action);
  }

  /**
   * ریست کردن فریم‌های لحظه‌ای (باید در پایان یا ابتدای هر گام Game Loop فراخوانی شود)
   */
  update() {
    this.justPressedActions.clear();
    this.justReleasedActions.clear();
  }

  /**
   * شبیه‌سازی فشرده شدن کلید (مفید برای پایپ‌لاین تست‌های خودکار)
   * @param {string} code
   */
  simulateKeyDown(code) {
    this.onKeyDown({ code, preventDefault: () => {} });
  }

  /**
   * شبیه‌سازی رها شدن کلید
   * @param {string} code
   */
  simulateKeyUp(code) {
    this.onKeyUp({ code, preventDefault: () => {} });
  }
}