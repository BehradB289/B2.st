"use client";

import React, { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { ContentType, CreateItemInput } from "@/types";
import { createPaypassItemAction } from "@/actions/paypass";
import { 
  Sparkles, 
  Link2, 
  FileText, 
  KeyRound, 
  Check, 
  Copy, 
  ArrowLeft, 
  CreditCard, 
  Eye, 
  Lock, 
  HelpCircle,
  AlertCircle 
} from "lucide-react";

export function CreateLinkForm() {
  const [contentType, setContentType] = useState<ContentType>("prompt");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rawContent, setRawContent] = useState("");
  const [priceInput, setPriceInput] = useState<string>("29000");
  const [shebaInput, setShebaInput] = useState<string>("IR120000000000000000000000");
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const priceNum = parseInt(priceInput.replace(/\D/g, ""), 10) || 0;
  const platformFee = Math.round(priceNum * 0.05);
  const creatorEarn = Math.max(0, priceNum - platformFee);

  const contentPlaceholders: Record<ContentType, { label: string; placeholder: string; hint: string }> = {
    prompt: {
      label: "متن پرامپت یا دستور مهندسی‌شده هوش‌مصنوعی",
      placeholder: "/imagine prompt: ultra-luxurious cyberpunk villa in Neo-Tehran, glass architecture, cyan neon ambient light, hyper-detailed, 8k --ar 16:9 --v 6.0",
      hint: "خریدار تنها پس از پرداخت به این پرامپت دقیق دسترسی پیدا خواهد کرد.",
    },
    link: {
      label: "لینک اختصاصی، کانال خصوصی تلگرام یا فایل گوگل‌درایو",
      placeholder: "https://t.me/+AbCdEfGhIjKlMnOpQrStUvWxYz",
      hint: "این لینک با رمزنگاری AES-256 محافظت شده و تنها به خریدار نمایش داده می‌شود.",
    },
    text: {
      label: "متن آموزشی، ایده یا مقاله اختصاصی",
      placeholder: "چک‌لیست ۱۰ مرحله‌ای لانچ کمپین‌های وایرال بدون بودجه تبلیغاتی اولیه...",
      hint: "متن تا قبل از تایید پرداخت با افکت بلور عمیق قفل خواهد بود.",
    },
    secret_key: {
      label: "لایسنس نرم‌افزار، کد تخفیف ۱۰۰٪ یا اکانت اشتراکی",
      placeholder: "PAYPASS-PRO-LICENSE-XXXX-YYYY-ZZZZ",
      hint: "ایده‌آل برای فروش فوری کلیدهای نرم‌افزاری و دسترسی‌های یکبار مصرف.",
    },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const payload: CreateItemInput = {
        title,
        description,
        contentType,
        rawContent,
        price: priceNum,
        creatorSheba: shebaInput,
      };

      const res = await createPaypassItemAction(payload);
      if (!res.success) {
        setErrorMsg(res.error || "خطایی در ساخت لینک پیش آمد.");
      } else if (res.data) {
        const fullUrl = `${window.location.origin}${res.data.url}`;
        setCreatedUrl(fullUrl);
      }
    } catch {
      setErrorMsg("خطای ارتباط با سرور رخ داد. مجدداً تلاش کنید.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!createdUrl) return;
    navigator.clipboard.writeText(createdUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div className="w-full">
      {/* If link created, show success glass modal */}
      {createdUrl ? (
        <GlassCard className="p-8 sm:p-10 border-brand-cyan/40 bg-gradient-to-b from-brand-cyan/[0.08] to-transparent">
          <div className="text-center max-w-lg mx-auto space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-brand-cyan/20 border border-brand-cyan/40 flex items-center justify-center mx-auto text-brand-cyan shadow-neon-cyan animate-bounce">
              <Check className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-2xl font-bold text-white mb-2">لینک پی‌پاس شما با موفقیت آماده شد!</h3>
              <p className="text-sm text-zinc-300">
                محتوای شما با کلید <span className="text-brand-cyan font-mono">AES-256</span> رمزنگاری شد. این لینک را در بایو اینستاگرام، توییتر یا چنل تلگرام خود قرار دهید.
              </p>
            </div>

            {/* Output Copy Box */}
            <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-[#090D16]/80 border border-white/15">
              <input
                type="text"
                readOnly
                value={createdUrl}
                className="w-full bg-transparent text-sm text-zinc-200 px-3 outline-none font-mono text-left"
                dir="ltr"
              />
              <Button size="sm" variant="primary" onClick={handleCopyLink} className="shrink-0">
                {isCopied ? (
                  <>
                    <Check className="w-4 h-4 text-[#090D16]" />
                    <span>کپی شد!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-[#090D16]" />
                    <span>کپی لینک</span>
                  </>
                )}
              </Button>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                href={createdUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-3 px-4 rounded-xl text-center text-sm font-semibold bg-white/10 hover:bg-white/15 text-white transition-colors border border-white/10"
              >
                تست و مشاهده صفحه خریدار
              </a>
              <button
                type="button"
                onClick={() => {
                  setCreatedUrl(null);
                  setTitle("");
                  setRawContent("");
                }}
                className="py-3 px-4 rounded-xl text-center text-sm font-medium text-zinc-400 hover:text-white transition-colors"
              >
                ساخت یک لینک جدید
              </button>
            </div>
          </div>
        </GlassCard>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <GlassCard className="p-6 sm:p-8 space-y-6">
            
            {/* Header info */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-brand-cyan/15 flex items-center justify-center text-brand-cyan">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">تولید فوری لینک فروش تک‌محتوایی</h2>
                  <p className="text-xs text-zinc-400">محتوای دیجیتال خود را بدون سایت، درگاه یا ثبت‌نام مانیتایز کنید.</p>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-1 text-[11px] text-zinc-400 bg-white/[0.04] px-2.5 py-1 rounded-full border border-white/5">
                <Lock className="w-3 h-3 text-brand-cyan" />
                <span>End-to-End Encrypted</span>
              </div>
            </div>

            {/* Error Notification */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Content Type Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300">نوع محتوایی که قصد فروش آن را دارید:</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(
                  [
                    { id: "prompt", label: "پرامپت AI", icon: Sparkles },
                    { id: "link", label: "لینک / فایل", icon: Link2 },
                    { id: "text", label: "متن / آموزش", icon: FileText },
                    { id: "secret_key", label: "لایسنس / کلید", icon: KeyRound },
                  ] as const
                ).map((t) => {
                  const Icon = t.icon;
                  const isSelected = contentType === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setContentType(t.id)}
                      className={`flex items-center justify-center gap-2 p-3 rounded-2xl text-xs font-medium border transition-all ${
                        isSelected
                          ? "bg-brand-cyan/15 border-brand-cyan text-brand-cyan shadow-[0_0_15px_rgba(0,242,254,0.2)]"
                          : "bg-white/[0.02] border-white/10 text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05]"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title & Short Description */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  عنوان آیتم (در صفحه قفل برای خریدار نمایش داده می‌شود)
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: پرامپت طلایی تولید تصاویر نئونی فوتورئال میدجورنی"
                  className="w-full px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-brand-cyan/60 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  توضیحات اختیاری (مزیت و محتوای آیتم برای ترغیب به پرداخت)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="مثال: به همراه آموزش گام‌به‌گام و نمونه تنظیمات پارامترهای نسخه ۶"
                  className="w-full px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-brand-cyan/60 transition-colors"
                />
              </div>
            </div>

            {/* Secret Content to Lock */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-brand-cyan" />
                  <span>{contentPlaceholders[contentType].label}</span>
                </label>
                <span className="text-[11px] text-zinc-500">رمزنگاری خودکار AES</span>
              </div>

              <textarea
                required
                rows={4}
                value={rawContent}
                onChange={(e) => setRawContent(e.target.value)}
                placeholder={contentPlaceholders[contentType].placeholder}
                className="w-full px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-brand-cyan/60 transition-colors font-mono"
              />
              <p className="text-[11px] text-zinc-400">{contentPlaceholders[contentType].hint}</p>
            </div>

            {/* Financial Parameters: Price & Sheba */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  قیمت فروش (تومان)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1000"
                    min="5000"
                    required
                    value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value)}
                    className="w-full pl-16 pr-4 py-3 rounded-2xl bg-white/[0.03] border border-white/10 text-sm text-white focus:outline-none focus:border-brand-cyan/60 transition-colors font-mono"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-zinc-400 font-sans pointer-events-none">
                    تومان
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  شماره شبا جهت تسویه آنی (بانک‌های عضو شتاب)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={shebaInput}
                    onChange={(e) => setShebaInput(e.target.value)}
                    placeholder="IR000000000000000000000000"
                    className="w-full px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/10 text-sm text-white focus:outline-none focus:border-brand-cyan/60 transition-colors font-mono text-left tracking-wider"
                    dir="ltr"
                  />
                  <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none hidden" />
                </div>
              </div>
            </div>

            {/* Financial breakdown card */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-zinc-400 block">سهم خالص دریافتی شما (۹۵٪):</span>
                  <span className="text-sm font-bold text-emerald-400">
                    {new Intl.NumberFormat("fa-IR").format(creatorEarn)} تومان
                  </span>
                </div>
              </div>

              <div className="text-zinc-400 text-left sm:text-right">
                <span className="block">کارمزد پلتفرم PayPass (۵٪):</span>
                <span className="text-zinc-300 font-mono">
                  {new Intl.NumberFormat("fa-IR").format(platformFee)} تومان
                </span>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="luxury"
                size="lg"
                isLoading={isLoading}
                className="w-full text-base group"
              >
                <span>تولید آنی پی‌پاس و دریافت لینک اختصاصی</span>
                <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
              </Button>
            </div>

          </GlassCard>
        </form>
      )}
    </div>
  );
}