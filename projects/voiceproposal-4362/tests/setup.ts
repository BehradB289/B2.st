/**
 * VoiceProposal - Vitest & JSDOM Setup Environment
 * ماک کردن الزامات React-PDF، محیط‌های مرورگر و Web Audio API در تست‌ها
 */
import { vi } from 'vitest';
import { Font } from '@react-pdf/renderer';

// ماک کردن Font.register برای جلوگیری از دانلود شبکه فونت‌ها در حین اجرای تست‌های سریع
vi.spyOn(Font, 'register').mockImplementation(() => {});
vi.spyOn(Font, 'registerHyphenationCallback').mockImplementation(() => {});

// ماک کردن آبجکت‌های مرورگر برای محیط‌های تست کلاینت
if (typeof window !== 'undefined') {
  window.URL.createObjectURL = vi.fn(() => 'blob:mocked-pdf-url');
  window.URL.revokeObjectURL = vi.fn();
}

// Polyfill برای TextEncoder در تست‌های Node اگر تعریف نشده باشد
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}