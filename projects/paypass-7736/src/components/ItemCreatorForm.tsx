"use client";

import React, { useState, useTransition } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { createItemAction, CreateItemResult } from "@/actions/create-item";
import { Lock, Sparkles, Copy, Check, ArrowLeft, ShieldCheck, Zap } from "lucide-react";

export function ItemCreatorForm() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<CreateItemResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await createItemAction(formData);
      setResult(res);
    });
  };

  const copyToClipboard = () => {
    if (result?.url) {
      navigator.clipboard.writeText(result.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <GlassCard className="p-8 sm:p-10 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-paypass-cyan to-paypass-violet p-[1px]">
          <div className="w-full h-full bg-paypass-bg rounded-[11px] flex items-center justify-center">
            <Lock className="w-5 h-5 text-paypass-cyan" />
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            ایجاد پی‌پاس جدید (قفل رمزنگاری شده)
          </h2>
          <p className="text-xs text-white/50">
            محتوا با کلید اختصاصی AES-256 رمزنگاری می‌شود و تنها پس از پرداخت ۵٪ کارمزد خودکار آزاد می‌گردد.
          </p>
        </div>
      </div>

      {result?.success ? (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="p-5 rounded-2xl bg-paypass-cyan/10 border border-paypass-cyan/30 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-paypass-cyan/20 text-paypass-cyan mb-3">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              لینک پی‌پاس اختصاصی شما ساخته شد!
            </h3>
            <p className="text-xs text-white/70">
              این لینک را برای خریدار بفرستید یا در بیو، کانال تلگرام و توییتر قرار دهید.
            </p>
          </div>

          <div className="flex items-center gap-2 p-3 bg-black/40 rounded-xl border border-white/10">
            <input
              type="text"
              readOnly
              value={result.url}
              className="bg-transparent flex-1 text-sm text-paypass-cyan font-mono outline-none px-2 dir-ltr text-left"
            />
            <button
              onClick={copyToClipboard}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium flex items-center gap-2 transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? "کپی شد" : "کپی لینک"}
            </button>
          </div>

          <button
            onClick={() => setResult(null)}
            className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 text-sm font-medium transition"
          >
            ساخت یک پی‌پاس دیگر
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {result?.message && !result.success && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
              {result.message}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-white/70 mb-2">
              عنوان محتوا یا فایل
            </label>
            <input
              type="text"
              name="title"
              required
              placeholder="مثال: دسترسی به سورس‌کد ربات ترید، لینک ویدیو محرمانه..."
              className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm placeholder:text-white/30 focus:border-paypass-cyan focus:outline-none transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-white/70 mb-2">
                قیمت فروش (تومان)
              </label>
              <input
                type="number"
                name="price"
                required
                min={1000}
                step={500}
                placeholder="مثال: 50000"
                className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm placeholder:text-white/30 focus:border-paypass-cyan focus:outline-none transition"
              />
              <span className="text-[11px] text-white/40 mt-1 block">
                ۵٪ کارمزد پلتفرم کسر و ۹۵٪ تسویه می‌شود
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-white/70 mb-2">
                مقصد تسویه (شماره شبا یا کارت)
              </label>
              <input
                type="text"
                name="payoutTarget"
                required
                placeholder="IR..."
                className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm placeholder:text-white/30 focus:border-paypass-cyan focus:outline-none transition font-mono dir-ltr text-right"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/70 mb-2 flex items-center justify-between">
              <span>محتوای محرمانه (متن، لینک، پسورد یا فایل)</span>
              <span className="text-paypass-cyan text-[11px] flex items-center gap-1 font-mono">
                <ShieldCheck className="w-3.5 h-3.5" /> AES-256 Encrypted
              </span>
            </label>
            <textarea
              name="secretContent"
              required
              rows={4}
              placeholder="لینک گوگل‌درایو، کد دسترسی، متن مقاله اختصاصی یا کانفیگ..."
              className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm placeholder:text-white/30 focus:border-paypass-cyan focus:outline-none transition font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/70 mb-2">
              توضیح اختیاری عمومی (قبل از پرداخت دیده می‌شود)
            </label>
            <textarea
              name="description"
              rows={2}
              placeholder="این محتوا شامل چه چیزهایی است؟"
              className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm placeholder:text-white/30 focus:border-paypass-cyan focus:outline-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full relative group overflow-hidden py-3.5 rounded-xl font-bold text-sm text-black transition disabled:opacity-50"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-paypass-cyan via-paypass-accent to-paypass-violet transition-transform group-hover:scale-105 duration-300" />
            <span className="relative flex items-center justify-center gap-2">
              {isPending ? (
                <>در حال رمزنگاری و ساخت لینک...</>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  قفل کن و لینک فوری بساز
                </>
              )}
            </span>
          </button>
        </form>
      )}
    </GlassCard>
  );
}