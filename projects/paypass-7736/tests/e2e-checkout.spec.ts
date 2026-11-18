/**
 * تست سرتاسری E2E مبتنی بر Playwright
 * شبیه‌سازی سناریوی کامل کاربر در پی‌پاس (PayPass) با زبان طراحی لوکس B2.st
 * tests/e2e-checkout.spec.ts
 */

import { test, expect } from '@playwright/test';

test.describe('PayPass E2E Instant Checkout & Vault Reveal Flow', () => {
  const TEST_ITEM_SLUG = 'design-system-b2st';
  const BUYER_EMAIL = 'artin@b2.st';

  test.beforeEach(async ({ page }) => {
    // باز کردن صفحه محصول تک‌لینکی پی‌پاس
    await page.goto(`/p/${TEST_ITEM_SLUG}`);
  });

  test('بررسی المان‌های لوکس شیشه‌ای و هویت بصری استودیو B2.st', async ({ page }) => {
    // پس‌زمینه دارک عمیق
    const body = page.locator('body');
    await expect(body).toHaveCSS('background-color', 'rgb(9, 13, 22)'); // #090D16

    // کارت اصلی با افکت بلور شیشه‌ای
    const glassCard = page.locator('[data-testid="paypass-glass-card"]');
    await expect(glassCard).toBeVisible();
    await expect(glassCard).toHaveClass(/backdrop-blur/);

    // گوی‌های نوری امبینت (Cyan / Violet Ambient Glows)
    const ambientGlow = page.locator('[data-testid="ambient-glow"]');
    await expect(ambientGlow.first()).toBeVisible();

    // نمایش قیمت و اطلاعات تک‌محتوا
    const priceTag = page.locator('[data-testid="item-price"]');
    await expect(priceTag).toBeVisible();
    await expect(priceTag).toContainText('تومان');
  });

  test('سناریوی موفق: خرید تک‌کلیکی، پرداخت درگاه، و آنباکس محتوای محافظت‌شده', async ({
    page,
  }) => {
    // ۱. اعتبارسنجی فرم قبل از پر کردن
    const checkoutBtn = page.locator('[data-testid="pay-submit-button"]');
    await expect(checkoutBtn).toBeVisible();

    // ۲. وارد کردن ایمیل خریدار
    const emailInput = page.locator('[data-testid="buyer-email-input"]');
    await emailInput.fill(BUYER_EMAIL);

    // ۳. کلیک روی پرداخت فوری با لودینگ لوکس
    await checkoutBtn.click();
    await expect(checkoutBtn).toHaveAttribute('data-loading', 'true');

    // ۴. هدایت به صفحه بازگشت پرداخت موفق (شبیه‌سازی بازگشت از شاپرک / درگاه)
    await page.waitForURL(/.*status=completed.*/);

    // ۵. مشاهده کارت بازگشایی محتوا (Glass Secret Vault Card)
    const unlockedVault = page.locator('[data-testid="unlocked-secret-vault"]');
    await expect(unlockedVault).toBeVisible({ timeout: 10_000 });

    // تایید باز شدن محتوا و عدم وجود سایفرتکست خام
    const secretContent = page.locator('[data-testid="unlocked-content-text"]');
    await expect(secretContent).toBeVisible();
    const contentText = await secretContent.innerText();
    expect(contentText.length).toBeGreaterThan(10);
    expect(contentText).not.toContain('authTag');

    // دکمه کپی لینک محتوا
    const copyButton = page.locator('[data-testid="copy-content-btn"]');
    await expect(copyButton).toBeVisible();
    await copyButton.click();

    // پیام کپی موفقیت‌آمیز
    const toast = page.locator('[data-testid="toast-notification"]');
    await expect(toast).toContainText('کپی شد');
  });

  test('سناریوی ناموفق: انصراف کاربر در درگاه و عدم نمایش محتوای قفل‌شده', async ({ page }) => {
    // ورود مستقیم به صفحه وریفای با فلگ خطا یا لغو پرداخت
    await page.goto(`/p/${TEST_ITEM_SLUG}?status=failed&error=cancelled_by_user`);

    // بررسی کارت خطای تراکنش
    const errorCard = page.locator('[data-testid="payment-failed-alert"]');
    await expect(errorCard).toBeVisible();
    await expect(errorCard).toContainText('پرداخت ناموفق بود');

    // عدم وجود هرگونه محتوای رمزشده یا قفل‌گشایی شده در DOM
    const unlockedVault = page.locator('[data-testid="unlocked-secret-vault"]');
    await expect(unlockedVault).toHaveCount(0);

    const secretContent = page.locator('[data-testid="unlocked-content-text"]');
    await expect(secretContent).toHaveCount(0);

    // دکمه تلاش مجدد برای بازگشت به فرایند خرید
    const retryBtn = page.locator('[data-testid="retry-payment-button"]');
    await expect(retryBtn).toBeVisible();
  });
});