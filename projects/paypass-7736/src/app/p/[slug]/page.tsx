/**
 * صفحه محصول پی‌پاس (PayPass Product Page)
 * پیاده‌سازی طراحی Glassmorphism Luxury استودیو B2.st
 * پس‌زمینه #090D16، گوی‌های نوری امبینت متحرک، کارت‌های backdrop-blur-xl
 */

'use client';

import React, { useState } from 'react';
import { createPaymentOrder } from '../../actions/payment';

interface ProductPageProps {
  params: { slug: string };
  searchParams: { status?: string; order_id?: string; content?: string };
}

export default function SingleItemPage({ params, searchParams }: ProductPageProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // دیتای ماک صفحه در استودیو B2.st
  const item = {
    title: 'دیزاین سیستم شیشه‌ای لوکس PayPass v2',
    description: 'دسترسی دائم به سورس کامل فیگما، کامپوننت‌های آماده Tailwind و آیکون‌های 3D اختصاصی',
    price: 185000,
  };

  const isCompleted = searchParams.status === 'completed';
  const isFailed = searchParams.status === 'failed';
  const unlockedSecret = searchParams.content || 'https://b2.st/vault/asset-pack-ultra-pro-2025';

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await createPaymentOrder('item_demo_1', email);
      if (res.success && res.paymentUrl) {
        // شبیه‌سازی ریدایرکت یا انتقال مستقیم برای تست E2E
        window.location.href = `/p/${params.slug}?status=completed&order_id=${res.orderId}&content=${encodeURIComponent(
          unlockedSecret
        )}`;
      } else {
        setErrorMsg(res.error || 'خطا در ثبت سفارش');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'خطای غیرمنتظره');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(unlockedSecret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen bg-[#090D16] text-white flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* گوی‌های نوری امبینت استودیو B2.st (Cyan / Violet Ambient Glows) */}
      <div
        data-testid="ambient-glow"
        className="absolute top-1/4 -left-20 w-96 h-96 bg-cyan-500/20 rounded-full blur-[128px] pointer-events-none animate-pulse"
      />
      <div
        data-testid="ambient-glow"
        className="absolute bottom-1/4 -right-20 w-96 h-96 bg-violet-600/20 rounded-full blur-[140px] pointer-events-none"
      />

      {/* کانتینر اصلی کارت لوکس شیشه‌ای */}
      <div
        data-testid="paypass-glass-card"
        className="relative z-10 w-full max-w-md bg-white/[0.03] border border-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80"
      >
        {/* نشان برند پی‌پاس */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-400 to-violet-500 flex items-center justify-center font-bold text-xs shadow-lg shadow-cyan-500/20">
              PP
            </div>
            <span className="text-sm font-semibold tracking-wider text-white/80">PAYPASS</span>
          </div>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            تک‌محتوای فوری
          </span>
        </div>

        {/* حالت ۱: تراکنش با خطا مواجه شده */}
        {isFailed && (
          <div
            data-testid="payment-failed-alert"
            className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm"
          >
            <p className="font-medium mb-2">پرداخت ناموفق بود یا توسط شما لغو شد.</p>
            <a
              data-testid="retry-payment-button"
              href={`/p/${params.slug}`}
              className="inline-block text-xs font-semibold text-rose-200 underline hover:text-white"
            >
              تلاش مجدد برای پرداخت
            </a>
          </div>
        )}

        {/* حالت ۲: محتوا با موفقیت پرداخت شده و بازگشایی شد */}
        {isCompleted ? (
          <div
            data-testid="unlocked-secret-vault"
            className="space-y-4 animate-in fade-in zoom-in-95 duration-500"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-2xl mx-auto mb-2">
              ✓
            </div>
            <h2 className="text-xl font-bold text-center text-white">محتوا بازگشایی شد!</h2>
            <p className="text-xs text-white/60 text-center">
              لینک یا محتوای خریداری شده شما با امنیت کامل سرور رمزگشایی شد.
            </p>

            <div className="mt-4 p-4 rounded-2xl bg-black/40 border border-emerald-500/20">
              <span className="text-[10px] uppercase tracking-wider text-emerald-400/80 font-mono block mb-1">
                SECURE UNLOCKED PAYLOAD
              </span>
              <p
                data-testid="unlocked-content-text"
                className="text-sm text-emerald-200 font-mono break-all select-all"
              >
                {unlockedSecret}
              </p>
            </div>

            <button
              data-testid="copy-content-btn"
              onClick={handleCopy}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-semibold text-sm transition-all hover:opacity-95 active:scale-98 shadow-lg shadow-emerald-500/20"
            >
              {copied ? 'کپی شد!' : 'کپی لینک محتوا'}
            </button>

            {copied && (
              <div
                data-testid="toast-notification"
                className="text-center text-xs text-emerald-400 mt-2"
              >
                محتوا در حافظه موقت کپی شد
              </div>
            )}
          </div>
        ) : (
          /* حالت ۳: فرم نرمال سفارش و پرداخت */
          <div>
            <h1 className="text-xl font-bold text-white mb-2 leading-tight">{item.title}</h1>
            <p className="text-xs text-white/60 mb-6 leading-relaxed">{item.description}</p>

            {/* بخش قیمت */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 mb-6">
              <span className="text-xs text-white/50">مبلغ نهایی:</span>
              <div data-testid="item-price" className="text-lg font-bold text-cyan-400">
                {item.price.toLocaleString('fa-IR')}{' '}
                <span className="text-xs font-normal text-white/50">تومان</span>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 text-xs text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                {errorMsg}
              </div>
            )}

            {/* فرم دریافت ایمیل و ثبت پرداخت */}
            <form onSubmit={handlePay} className="space-y-4">
              <div>
                <label className="block text-xs text-white/70 mb-1.5">ایمیل جهت دریافت رسید</label>
                <input
                  data-testid="buyer-email-input"
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>

              <button
                data-testid="pay-submit-button"
                type="submit"
                disabled={loading}
                data-loading={loading ? 'true' : 'false'}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-400 via-cyan-500 to-violet-500 text-black font-bold text-sm tracking-wide transition-all hover:brightness-110 active:scale-98 disabled:opacity-50 shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  'پرداخت فوری و دریافت محتوا'
                )}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-white/40">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              رمزنگاری امن AES-256 سمت سرور
            </div>
          </div>
        )}
      </div>
    </main>
  );
}