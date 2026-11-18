import React from "react";
import { CreateLinkForm } from "@/components/create/CreateLinkForm";
import { GlassCard } from "@/components/ui/GlassCard";
import { Shield, Zap, Sparkles, Lock, ArrowUpRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-12">
      
      {/* Hero Section */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan text-xs font-semibold backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5" />
          <span>پلتفرم مینیمال میکرومانتایز تک‌محتوایی</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
          فروش هر محتوا، <br />
          <span className="bg-gradient-to-r from-brand-cyan via-brand-teal to-brand-violet bg-clip-text text-transparent">
            فقط با یک لینک شیشه‌ای
          </span>
        </h1>

        <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
          پرامپت‌های هوش مصنوعی، لینک‌های اختصاصی، دوره‌های میکرو یا لایسنس‌های خود را بدون درگیر شدن با طراحی سایت و سامانه‌های پیچیده، در ۳۰ ثانیه تبدیل به پول نقد کنید.
        </p>
      </div>

      {/* Main Generator Form */}
      <CreateLinkForm />

      {/* Feature Pillars (Luxury Glass Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        
        <GlassCard className="p-6 space-y-3" interactive>
          <div className="w-10 h-10 rounded-xl bg-brand-cyan/10 border border-brand-cyan/30 flex items-center justify-center text-brand-cyan">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">رمزنگاری AES-256</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            محتوای شما قبل از ذخیره‌سازی رمزنگاری شده و کلید آزادسازی تنها به خریدار موفق بعد از تایید وب‌هوک بانکی اعطا می‌شود.
          </p>
        </GlassCard>

        <GlassCard className="p-6 space-y-3" interactive>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">تسویه آنی با ۵٪ کارمزد</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            بدون هزینه اشتراک ماهانه یا پنهان. ۹۵٪ مبلغ هر فروش مستقیماً به شماره شبای بانکی شما واریز خواهد شد.
          </p>
        </GlassCard>

        <GlassCard className="p-6 space-y-3" interactive>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">تجربه آنلاک لوکس</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            کارت‌های مات شیشه‌ای مجهز به انیمیشن‌های روان Framer Motion و افکت شکستن قفل، اعتماد و نرخ تبدیل خریدار را به اوج می‌رسانند.
          </p>
        </GlassCard>

      </div>

      {/* Quick Live Demo Link */}
      <div className="text-center pt-2">
        <Link
          href="/demo-vip"
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-brand-cyan transition-colors"
        >
          <span>می‌خواهید بدانید خریدار محتوای شما را چگونه می‌بیند؟ تست لایو نمونه</span>
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

    </div>
  );
}