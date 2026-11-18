'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { AudioRecorder } from '@/components/AudioRecorder';
import { GlassCard } from '@/components/GlassCard';
import { FileText, ShieldCheck, Zap, Sparkles, Cpu } from 'lucide-react';

export default function HomePage() {
  const [hasCapturedAudio, setHasCapturedAudio] = useState(false);

  const handleAudioCaptured = (blob: Blob) => {
    setHasCapturedAudio(true);
    // Prepared for Server Action Groq Whisper-large-v3 transcription
    console.log('Voice file captured ready for processing:', blob.size, blob.type);
  };

  return (
    <main className="min-h-screen px-4 md:px-8 max-w-6xl mx-auto pb-16">
      <Header />

      {/* Hero Presentation */}
      <section className="text-center py-10 md:py-14 flex flex-col items-center gap-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-950/50 border border-purple-500/30 text-purple-300 text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>هوش مصنوعی استودیو B2.st برای قرارداد و پیش‌فاکتور</span>
        </div>

        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white max-w-3xl leading-tight">
          صدایتان را ضبط کنید؛{' '}
          <span className="bg-gradient-to-l from-mesh-cyan via-purple-300 to-mesh-purple bg-clip-text text-transparent">
            پیش‌فاکتور حقوقی شکیل
          </span>{' '}
          تحویل بگیرید.
        </h1>

        <p className="text-slate-400 text-sm md:text-base max-w-2xl leading-relaxed">
          تنها با ارسال یک وویس فارسی، Whisper-large-v3 و Llama-3-70b جزئیات، فازبندی، مبالغ و
          بندهای فورس‌ماژور را استخراج کرده و سندی معتبر در مرورگر تولید می‌کنند.
        </p>
      </section>

      {/* Core Interactive Audio Recorder Component */}
      <section className="my-4">
        <AudioRecorder onAudioCaptured={handleAudioCaptured} />
      </section>

      {/* Feature Matrix Glass Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        <GlassCard className="flex flex-col gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Zap className="w-5 h-5" />
          </div>
          <h4 className="text-lg font-bold text-white">تاخیر زیر ۱ ثانیه</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            استریم آنی صوت توسط Groq Cloud با چیپ‌های LPU و مدل Whisper-large-v3 با بیشترین دقت در زبان فارسی.
          </p>
        </GlassCard>

        <GlassCard className="flex flex-col gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Cpu className="w-5 h-5" />
          </div>
          <h4 className="text-lg font-bold text-white">انطباق ساختار Zod</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            تبدیل گفتار نامنظم به JSON مهندسی‌شده شامل جداول هزینه، زمان‌بندی مایل‌استون‌ها و شرایط تسویه حساب.
          </p>
        </GlassCard>

        <GlassCard className="flex flex-col gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h4 className="text-lg font-bold text-white">خروجی PDF صفر-هزینه</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            تولید مستقیم سند رسمی PDF در مرورگر کلاینت با React-PDF بدون بار پردازشی بر سرورلس Vercel.
          </p>
        </GlassCard>
      </section>

      {/* Live State Simulation Banner */}
      {hasCapturedAudio && (
        <section className="mt-8">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/40 to-slate-900/40 border border-purple-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-purple-400" />
              <span className="text-sm font-medium text-purple-200">
                سیگنال با موفقیت استخراج شد. آماده اجرای متد Server Action و تولید پروپوزال نهایی.
              </span>
            </div>
            <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
              STATUS: READY
            </span>
          </div>
        </section>
      )}

      {/* Studio Footer */}
      <footer className="mt-16 pt-8 border-t border-white/[0.08] flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} استودیو B2.st. تمامی حقوق محفوظ است.</p>
        <p className="font-mono">Next.js 14 App Router &bull; Web Audio API &bull; Glassmorphic UI</p>
      </footer>
    </main>
  );
}