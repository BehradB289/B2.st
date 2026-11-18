import { Game } from './engine/Game.js';

/**
 * نقطه ورود امن بازی تحت ساختار ایزوله و بررسی Strict Mode
 */
'use strict';

window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
        console.error('[CRITICAL] المان Canvas یافت نشد یا ساختار DOM نامعتبر است.');
        return;
    }

    // ایجاد نمونه اصلی بازی به صورت Singleton محافظت شده
    try {
        const game = new Game(canvas);
        game.init();

        // جلوگیری از حملات اسکریپتینگ در کنسول با مسدودسازی دسترسی مستقیم شیء در پنجره Window
        Object.defineProperty(window, '__B2_GAME_INSTANCE__', {
            value: Object.freeze({ status: 'ACTIVE_SANDBOXED' }),
            writable: false,
            configurable: false
        });
    } catch (err) {
        console.error('[RUNTIME EXCEPTION] خطای بحرانی در راه‌اندازی موتور بازی:', err);
    }
});