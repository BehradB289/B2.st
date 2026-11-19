/**
 * @file validator.js
 * @module B2st/Security/Validator
 * @description سیستم اعتبارسنجی ۱۰ لایه و محافظت در برابر مقادیر Null / Undefined و سرریز نوع داده
 * طراحی شده توسط استودیو B2.st برای موتور بازی ماریو (HTML5 Canvas/WebGL)
 */

'use strict';

/**
 * پیکربندی مقادیر آستانه و تنظیمات ایمنی موتور فیزیک
 */
const SECURITY_POLICY = Object.freeze({
    MAX_DELTA_TIME: 0.1, // جلوگیری از پدیده Spiral of Death در لگ‌های فریم
    MIN_DELTA_TIME: 0.0001,
    MAX_CANVAS_DIMENSION: 16384,
    SAFE_COORDINATE_LIMIT: 1000000,
    ALLOWED_INPUT_KEYS: new Set([
        'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
        'KeyA', 'KeyD', 'KeyW', 'KeyS',
        'Space', 'ShiftLeft', 'ControlLeft', 'Escape', 'Enter'
    ])
});

/**
 * لایه ۱: اعتبارسنجی اولیه تهی‌بودگی (Null / Undefined Guard)
 */
export function isNil(value) {
    return value === null || value === undefined;
}

export function isDefined(value) {
    return value !== null && value !== undefined;
}

/**
 * لایه ۲: اعتبارسنجی ایمن اعداد (Safe Number & Anti-NaN Guard)
 */
export function isSafeNumber(value) {
    return typeof value === 'number' && Number.isFinite(value) && !Number.isNaN(value);
}

export function clampNumber(value, min, max, fallback = 0) {
    if (!isSafeNumber(value)) return fallback;
    const safeMin = isSafeNumber(min) ? min : Number.MIN_SAFE_INTEGER;
    const safeMax = isSafeNumber(max) ? max : Number.MAX_SAFE_INTEGER;
    return Math.min(Math.max(value, safeMin), safeMax);
}

/**
 * لایه ۳: پاک‌سازی و اعتبارسنجی دلتا تایم (Delta-Time Sanitizer)
 * جلوگیری از عبور ماریو از دیوارها در اثر پرش زمانی (Tunneling Bug)
 */
export function sanitizeDeltaTime(dt, fallback = 0.0166) {
    if (!isSafeNumber(dt) || dt <= 0) {
        return fallback;
    }
    return Math.min(Math.max(dt, SECURITY_POLICY.MIN_DELTA_TIME), SECURITY_POLICY.MAX_DELTA_TIME);
}

/**
 * لایه ۴: اعتبارسنجی ساختار آبجکت و جلوگیری از حملات Prototype Pollution
 */
export function isPlainObject(value) {
    if (isNil(value) || typeof value !== 'object' || Array.isArray(value)) {
        return false;
    }
    const proto = Object.getPrototypeOf(value);
    return proto === null || proto === Object.prototype;
}

/**
 * لایه ۵: اعتبارسنجی بردار ۲ بعدی (Vector2D Guard)
 * مورد استفاده در موقعیت، سرعت (Velocity) و شتاب ماریو و انمی‌ها
 */
export function validateVector2D(vec, fallback = { x: 0, y: 0 }) {
    const safeFallback = {
        x: isSafeNumber(fallback?.x) ? fallback.x : 0,
        y: isSafeNumber(fallback?.y) ? fallback.y : 0
    };

    if (isNil(vec) || typeof vec !== 'object') {
        return safeFallback;
    }

    return {
        x: isSafeNumber(vec.x) ? clampNumber(vec.x, -SECURITY_POLICY.SAFE_COORDINATE_LIMIT, SECURITY_POLICY.SAFE_COORDINATE_LIMIT) : safeFallback.x,
        y: isSafeNumber(vec.y) ? clampNumber(vec.y, -SECURITY_POLICY.SAFE_COORDINATE_LIMIT, SECURITY_POLICY.SAFE_COORDINATE_LIMIT) : safeFallback.y
    };
}

/**
 * لایه ۶: اعتبارسنجی کادر برخورد (AABB Bounding Box)
 * تضمین جلوگیری از خطاهای کرش در الگوریتم‌های Collision Detection
 */
export function validateBoundingBox(box) {
    if (!isPlainObject(box)) {
        return { x: 0, y: 0, width: 0, height: 0, isValid: false };
    }

    const x = isSafeNumber(box.x) ? box.x : 0;
    const y = isSafeNumber(box.y) ? box.y : 0;
    const width = isSafeNumber(box.width) && box.width >= 0 ? box.width : 0;
    const height = isSafeNumber(box.height) && box.height >= 0 ? box.height : 0;

    return {
        x,
        y,
        width,
        height,
        isValid: width > 0 && height > 0
    };
}

/**
 * لایه ۷: اعتبارسنجی ایندکس‌ها و شبکه کاشی‌ها (Tilemap Matrix Safety)
 * جلوگیری از رخداد خطای خروج از حافظه و TypeError در رندر مپ
 */
export function validateTileAccess(grid, row, col) {
    if (!Array.isArray(grid)) return null;
    if (!Number.isInteger(row) || row < 0 || row >= grid.length) return null;
    
    const rowData = grid[row];
    if (!Array.isArray(rowData)) return null;
    if (!Number.isInteger(col) || col < 0 || col >= rowData.length) return null;

    return rowData[col];
}

/**
 * لایه ۸: گارد اعتبارسنجی وضعیت انتیتی (Entity Integrity Validator)
 * برای ماریو، قارچ، سکه و دشمنان (Goomba / Koopa)
 */
export function validateEntityState(entity) {
    if (!isPlainObject(entity)) {
        throw new TypeError('[B2.st Shield] داده انتیتی نامعتبر بوده یا تهی است.');
    }

    // نرمال‌سازی پوزیشن و ابعاد
    entity.pos = validateVector2D(entity.pos, { x: 0, y: 0 });
    entity.vel = validateVector2D(entity.vel, { x: 0, y: 0 });
    entity.size = validateVector2D(entity.size, { x: 16, y: 16 });

    // وضعیت‌های منطقی حیاتی
    entity.isGrounded = Boolean(entity.isGrounded);
    entity.isDead = Boolean(entity.isDead);
    entity.type = typeof entity.type === 'string' && entity.type.trim().length > 0 ? entity.type : 'unknown';

    return entity;
}

/**
 * لایه ۹: اعتبارسنجی ورودی‌های کاربر (Input Sanitizer)
 * حذف کلیدهای نامعتبر و رفتارهای مخرب احتمالی
 */
export function sanitizeInputKey(rawCode) {
    if (typeof rawCode !== 'string') return null;
    const sanitized = rawCode.trim();
    return SECURITY_POLICY.ALLOWED_INPUT_KEYS.has(sanitized) ? sanitized : null;
}

/**
 * لایه ۱۰: بازرسی سلامت کانتکست گرافیکی (Canvas Context Guard)
 */
export function assertRenderingContext(ctx) {
    if (isNil(ctx) || typeof ctx.drawImage !== 'function' || typeof ctx.clearRect !== 'function') {
        throw new Error('[B2.st Shield] CanvasRenderingContext2D نامعتبر است یا تخریب شده است.');
    }
    return true;
}

// آبجکت فریز شده برای جلوگیری از Tampering و Monkey Patching در لایه ران‌تایم
export default Object.freeze({
    isNil,
    isDefined,
    isSafeNumber,
    clampNumber,
    sanitizeDeltaTime,
    isPlainObject,
    validateVector2D,
    validateBoundingBox,
    validateTileAccess,
    validateEntityState,
    sanitizeInputKey,
    assertRenderingContext,
    SECURITY_POLICY
});