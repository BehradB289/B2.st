import React from 'react';
import Link from 'next/link';
import { verifyPaymentWebhook } from '../../actions/payment';

interface VerifyPageProps {
  searchParams: {
    Authority?: string;
    Status?: string;
  };
}

export const dynamic = 'force-dynamic';

/**
 * صفحه لوکس شیشه‌ای (Glassmorphism Luxury) پی‌پاس جهت نمایش وضعیت تراکنش و تحویل محتوا
 */
export default async function CheckoutVerifyPage({ searchParams }: VerifyPageProps) {
  const authority = searchParams.Authority || '';
  const status = searchParams.Status || '';

  const result = await verifyPaymentWebhook(authority, status);

  return (
    <main className="relative min-h-screen bg-[#090D16] text-white flex items-center justify-center p-4 sm:p-6 overflow-hidden font-sans selection:bg-cyan-500 selection:text-black">
      {/* گوی‌های نورانی امبینت متحرک در پس‌زمینه دارک عمیق */}
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-cyan-500/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-violet-600/20 rounded-full blur-[140px] pointer-events-none" />

      {/* کانتینر کارت معلق شیشه‌ای */}
      <div className="relative w-full max-w-xl backdrop-blur-xl bg-[#0e1424]/75 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_12px_48px_0_rgba(0,0,0,0.6)]">
        {/* نشان اصالت استودیو B2.st */}
        <div className="flex items-center justify-between border-b border-white/10 pb-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-400 to-violet-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <span className="font-black text-sm tracking-tighter text-white">B2</span>
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                پی‌پاس <span className="text-cyan-400 font-mono text-xs">/ PayPass</span>
              </h1>
              <p className="text-xs text-slate-400 mt-1">تراکنش آنی و امن میکرومانتایز</p>
            </div>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
            کارمزد شفاف ۵٪
          </span>
        </div>

        {result.success && result.item ? (
          /* حالت پرداخت موفق و آنلاک محتوا */
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl">
              <span className="text-2xl">⚡</span>
              <div>
                <h2 className="font-semibold text-sm sm:text-base">{result.message}</h2>
                {result.refId && (
                  <p className="text-xs text-emerald-400/80 font-mono mt-0.5">
                    شماره پیگیری شاپرک: {result.refId}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-2xl p-5 space-y-3">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>عنوان محتوا:</span>
                <span className="font-medium text-white">{result.item.title}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>نوع تحویل:</span>
                <span className="uppercase text-cyan-400 font-mono">{result.item.contentType}</span>
              </div>

              {/* باکس محتوای محرمانه رمزگشایی‌شده */}
              <div className="mt-4 pt-4 border-t border-white/10">
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  🔒 محتوای آنلاک‌شده شما (AES-256 Decrypted):
                </label>
                <div className="relative group">
                  <div className="bg-[#090D16] border border-cyan-500/30 rounded-xl p-4 text-cyan-300 font-mono text-sm break-all select-all">
                    {result.item.unlockedContent}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Link
                href="/"
                className="w-full text-center py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-black font-bold text-sm transition-all duration-200 shadow-lg shadow-cyan-500/20"
              >
                بازگشت به پیشخوان
              </Link>
            </div>
          </div>
        ) : (
          /* حالت خطا یا انصراف */
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto text-3xl">
              ⚠️
            </div>
            <div>
              <h2 className="text-lg font-bold text-white mb-2">تراکنش به سرانجام نرسید</h2>
              <p className="text-sm text-slate-400 max-w-sm mx-auto">
                {result.message || 'پرداخت با موفقیت انجام نشد یا ارتباط با درگاه بانکی برقرار نگردید.'}
              </p>
            </div>
            <Link
              href="/"
              className="inline-block py-3 px-6 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-medium text-sm transition-all"
            >
              تلاش مجدد و خرید دوباره
            </Link>
          </div>
        )}

        <div className="mt-6 text-center">
          <span className="text-[11px] text-slate-500 font-mono tracking-wider">
            POWERED BY B2.ST STUDIO LUXURY ARCHITECTURE
          </span>
        </div>
      </div>
    </main>
  );
}