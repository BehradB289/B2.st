/**
 * EventEmitter - سیستم توزیع رویدادهای غیرهمگام با حافظه بهینه
 * پیاده‌سازی مستقل جهت مدیریت رویدادهای فیزیکی، ورودی‌ها و چرخه بازی در B2.st
 */
export class EventEmitter {
  constructor() {
    /** @type {Map<string, Set<Function>>} */
    this.events = new Map();
  }

  /**
   * ثبت شنونده رویداد
   * @param {string} eventName
   * @param {Function} listener
   * @returns {EventEmitter}
   */
  on(eventName, listener) {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, new Set());
    }
    this.events.get(eventName).add(listener);
    return this;
  }

  /**
   * ثبت شنونده یک‌بارمصرف
   * @param {string} eventName
   * @param {Function} listener
   * @returns {EventEmitter}
   */
  once(eventName, listener) {
    const onceWrapper = (...args) => {
      this.off(eventName, onceWrapper);
      listener.apply(this, args);
    };
    return this.on(eventName, onceWrapper);
  }

  /**
   * لغو ثبت شنونده رویداد
   * @param {string} eventName
   * @param {Function} listener
   * @returns {EventEmitter}
   */
  off(eventName, listener) {
    if (!this.events.has(eventName)) return this;
    const listeners = this.events.get(eventName);
    listeners.delete(listener);
    if (listeners.size === 0) {
      this.events.delete(eventName);
    }
    return this;
  }

  /**
   * دیسپچ و ارسال رویداد به تمام شنوندگان
   * @param {string} eventName
   * @param  {...any} args
   * @returns {boolean} آیا شنونده‌ای واکنش نشان داد؟
   */
  emit(eventName, ...args) {
    if (!this.events.has(eventName)) return false;
    const listeners = [...this.events.get(eventName)];
    for (let i = 0; i < listeners.length; i++) {
      listeners[i](...args);
    }
    return true;
  }

  /**
   * پاک‌سازی تمامی شنوندگان
   */
  clear() {
    this.events.clear();
  }
}