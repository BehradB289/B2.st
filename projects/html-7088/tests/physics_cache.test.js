/**
 * پایپ‌لاین آزمون‌های واحد موتور فیزیک، کشینگ و کنترلر ریت‌لیمیتر
 * قابل اجرا در Node.js یا مستقیماً در کنسول مرورگر
 */
import { PerformanceCache, RateLimiter } from '../src/core/performance_cache.js';
import { Physics } from '../src/engine/Physics.js';

function runTests() {
    console.log('--- [B2.st Test Runner] شروع اعتبارسنجی سیستم‌ها ---');
    let passed = 0;
    let failed = 0;

    function assert(condition, testName) {
        if (condition) {
            console.log(`✅ [PASS] ${testName}`);
            passed++;
        } else {
            console.error(`❌ [FAIL] ${testName}`);
            failed++;
        }
    }

    // ۱. تست صحت عملکرد AABB فیزیک
    const boxA = { x: 10, y: 10, width: 20, height: 20 };
    const boxB = { x: 25, y: 25, width: 20, height: 20 };
    const boxC = { x: 50, y: 50, width: 20, height: 20 };

    assert(Physics.checkAABB(boxA, boxB) === true, 'Physics: تداخل دو باکس متقاطع شناسایی شد');
    assert(Physics.checkAABB(boxA, boxC) === false, 'Physics: عدم تداخل دو باکس مجزا تأیید شد');

    // ۲. تست موتور کشینگ درون‌حافظه‌ای با TTL
    const cache = new PerformanceCache({ defaultTTL: 100, maxEntries: 3 });
    cache.set('key1', 'value1');
    assert(cache.get('key1') === 'value1', 'Cache: مقدار ذخیره‌شده به درستی دریافت شد');
    assert(cache.metrics.hits === 1, 'Cache: شمارنده Hits به درستی افزایش یافت');

    // تست LRU Eviction در زمان تکمیل ظرفیت
    cache.set('key2', 'value2');
    cache.set('key3', 'value3');
    cache.set('key4', 'value4'); // کلید ۱ باید دور انداخته شود زیرا ظرفیت ۳ است
    assert(cache.get('key1') === null, 'Cache: سیستم LRU قدیمی‌ترین مدخل را به درستی حذف کرد');
    assert(cache.get('key4') === 'value4', 'Cache: مدخل جدید با موفقیت جایگزین شد');

    // ۳. تست RateLimiter
    const rateLimiter = new RateLimiter();
    let executionCount = 0;
    const testAction = () => { executionCount++; };

    // اجرای اول باید مجاز باشد
    rateLimiter.throttle('jump_sfx', 50, testAction);
    // اجرای دوم بلافاصله پس از اولی باید رد شود
    rateLimiter.throttle('jump_sfx', 50, testAction);

    assert(executionCount === 1, 'RateLimiter: از اجرای دومین درخواست با فاصله زمانی ناچیز ممانعت شد');

    cache.destroy();
    console.log(`--- پایان تست‌ها: ${passed} موفق، ${failed} ناموفق ---`);
}

// اجرای خودکار در صورت اجرا با Node.js
if (typeof process !== 'undefined' && process.release?.name === 'node') {
    runTests();
} else if (typeof window !== 'undefined') {
    window.runB2stTests = runTests;
}