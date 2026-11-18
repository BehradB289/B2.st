import React from "react";
import { ItemCreatorForm } from "@/components/ItemCreatorForm";
import { Sparkles, ShieldAlert, Cpu, DollarSign } from "lucide-react";

export default function HomePage() {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-6 pt-6 sm:pt-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/10 text-xs text-paypass-cyan font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          <span>نسل جدید فروش محتوا با یک پیوند و ۵٪ کارمزد خودکار</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight max-w-4xl mx-auto">
          محتوای باارزشت را قفل کن،{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-paypass-cyan via-white to-paypass-violet">
            لینک بگیر و آنی نقد کن.
          </span>
        </h1>

        <p className="text-sm sm:text-base text-white/60 max-w-2xl mx-auto leading-relaxed">
          بدون نیاز به راه‌اندازی سایت یا احراز هویت‌های پیچیده؛ محتوا، لینک دانلود یا کلید اختصاصی خود را با امنیت AES-256 قفل کنید و لینک مستقیم فروش بگیرید.
        </p>

        {/* Feature Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto pt-4 text-right">
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <div className="flex items-center gap-2 text-paypass-cyan mb-1 font-bold text-xs">
              <Cpu className="w-4 h-4" /> رمزنگاری پیشرفته AES-256
            </div>
            <p className="text-[11px] text-white/50">
              محتوای اصلی تا لحظه تایید ۱۰۰٪ امضای درگاه بانکی حتی برای مدیران دیتابیس غیرقابل مشاهده است.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <div className="flex items-center gap-2 text-paypass-violet mb-1 font-bold text-xs">
              <DollarSign className="w-4 h-4" /> تسویه خودکار ۹۵٪
            </div>
            <p className="text-[11px] text-white/50">
              ۵٪ سهم پلتفرم و ۹۵٪ سهم پدیدآورنده مستقیماً به شبا یا کیف‌پول واریز می‌شود.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <div className="flex items-center gap-2 text-emerald-400 mb-1 font-bold text-xs">
              <ShieldAlert className="w-4 h-4" /> بدون نیاز به ثبت‌نام
            </div>
            <p className="text-[11px] text-white/50">
              فقط فرم زیر را پر کنید و بلافاصله لینک اختصاصی فروش تحویل بگیرید.
            </p>
          </div>
        </div>
      </section>

      {/* Main Interactive Form Component */}
      <section id="create" className="pt-4">
        <ItemCreatorForm />
      </section>
    </div>
  );
}