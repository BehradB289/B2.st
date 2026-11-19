/**
 * @file index.js
 * @description ورودی کلاینت و بوت‌استرپینگ امن ماژول‌ها
 * @studio B2.st
 */

import { Sanitizer } from './security/Sanitizer.js';
import { Game } from './engine/Game.js';

// ۱. اجرای محافظت‌های لایه پروتوتایپ
Sanitizer.lockPrototypes();

// ۲. راه‌اندازی ایمن پس از بارگذاری DOM
window.addEventListener('DOMContentLoaded', () => {
    try {
        const canvas = document.getElementById('gameCanvas');
        if (!(canvas instanceof HTMLCanvasElement)) {
            throw new Error('المان Canvas یافت نشد یا نامعتبر است.');
        }

        const engine = new Game(canvas);
        engine.start();

        // ثبت رصدگر خطاهای زمان اجرا در کانسول B2.st
        window.addEventListener('error', (event) => {
            console.error('[B2.st Watchdog Caught Error]:', event.message, event.filename, event.lineno);
        });

    } catch (bootstrapError) {
        console.error('[B2.st Engine Bootstrap Failed]:', bootstrapError);
    }
});