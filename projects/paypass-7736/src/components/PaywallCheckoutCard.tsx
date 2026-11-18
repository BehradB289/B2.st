"use client";

import React, { useState, useTransition } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { formatPrice } from "@/lib/utils";
import { Lock, Shield, CheckCircle2, CreditCard, ChevronLeft } from "lucide-react";
import { createCheckoutSession } from "@/actions/checkout";

interface PaywallCheckoutCardProps {
  slug: string;
  title: string;
  description: string;
  price: number;
}

export function PaywallCheckoutCard({
  slug,
  title,
  description,
  price,
}: PaywallCheckoutCardProps) {
  const [identifier, setIdentifier] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!identifier || identifier.length < 5) {
      setErrorMsg("لطفاً شماره موبایل یا ایمیل معتبر خود را وارد نمایید.");
      return;
    }

    startTransition(async () => {
      const res = await createCheckoutSession(slug, identifier);
      if (res.success && res.redirectUrl) {
        window.location.href = res.redirectUrl;
      } else {
        setErrorMsg(res.message || "خطا در اتصال به درگاه پرداخت.");
      }
    });
  };

  return (
    <GlassCard className="max-w-xl mx-auto p-8 sm:p-10 border-white/[0.12]">
      {/* Paywall Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-paypass-cyan/20 to-paypass-violet/20 border border-white/10 mb-4 animate-float">
          <Lock className="w-8 h-8 text-paypass-cyan" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>
        {description && (
          <p className="text-sm text-white/60 leading-relaxed max-w-md mx-auto">
            {description}
          </p>
        )}
      </div>

      {/* Paywall Locked Preview */}
      <div className="relative overflow-hidden rounded-2xl bg-black/40 border border-white/10 p-5 mb-8">
        <div className="filter blur-sm select-none opacity-40 pointer-events-none font-mono text-xs text-white space-y-2">
          <p>PAYPASS_CONTENT_PAYLOAD_LOCKED_KEY_256_AES</p>
          <p>https://drive.google.com/file/d/1aB2c3D4e5F6g7H8j9K0...</p>
          <p>Access Token: secret_live_****************</p>
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
          <span className="text-xs font-bold text-white/90 bg-white/10 px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-paypass-cyan" /> محتوای امن رمزنگاری‌شده
          </span>
        </div>
      </div>

      {/* Payment Form */}
      <form onSubmit={handlePay} className="space-y-6">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-white/70 mb-2">
            شماره موبایل یا ایمیل (جهت دریافت فاکتور و کلید دسترسی)
          </label>
          <input
            type="text"
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="0912... یا you@domain.com"
            className="w-full px-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm placeholder:text-white/30 focus:border-paypass-cyan focus:outline-none transition"
          />
        </div>

        {/* Pricing Summary */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
          <span className="text-xs text-white/60">مبلغ قابل پرداخت:</span>
          <span className="text-lg font-bold text-paypass-cyan">
            {formatPrice(price)}
          </span>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full relative group overflow-hidden py-4 rounded-xl font-bold text-black text-sm transition disabled:opacity-50"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-paypass-cyan via-paypass-accent to-paypass-violet transition-transform group-hover:scale-105" />
          <span className="relative flex items-center justify-center gap-2">
            {isPending ? (
              <>در حال انتقال به درگاه شاپرک...</>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                پرداخت و آزادسازی آنی محتوا
                <ChevronLeft className="w-4 h-4" />
              </>
            )}
          </span>
        </button>

        <div className="flex items-center justify-center gap-4 text-[11px] text-white/40">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            تحویل آنی پس از پرداخت
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-paypass-cyan" />
            تضمین امنیت پرداخت شاپرک
          </span>
        </div>
      </form>
    </GlassCard>
  );
}