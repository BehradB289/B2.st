"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Sparkles, Zap } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-4 z-40 w-full max-w-5xl mx-auto px-4">
      <div className="flex items-center justify-between px-5 py-3.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-2xl shadow-glass">
        
        {/* Brand identity */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-brand-cyan to-brand-violet p-[1.5px] transition-transform duration-300 group-hover:scale-105">
            <div className="w-full h-full bg-[#090D16] rounded-[10px] flex items-center justify-center">
              <Zap className="w-5 h-5 text-brand-cyan drop-shadow-[0_0_8px_#00F2FE]" />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white group-hover:text-brand-cyan transition-colors">
                PayPass
              </span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-md bg-brand-violet/30 text-purple-300 border border-purple-500/30">
                B2.st
              </span>
            </div>
            <span className="text-[11px] text-zinc-400 font-normal">پی‌پاس • میکرومانتایز آنی</span>
          </div>
        </Link>

        {/* Studio Features / Security Badges */}
        <div className="hidden sm:flex items-center gap-4 text-xs font-medium text-zinc-300">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>رمزنگاری AES-256</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/5">
            <Sparkles className="w-3.5 h-3.5 text-brand-cyan" />
            <span>کارمزد مینیمال ۵٪</span>
          </div>
        </div>

        {/* Quick Action Button */}
        <div>
          <Link
            href="/demo-vip"
            className="text-xs font-semibold px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 hover:text-white border border-white/10 transition-all flex items-center gap-1.5"
          >
            <span>مشاهده نمونه خریدار</span>
            <span className="w-2 h-2 rounded-full bg-brand-cyan animate-ping" />
          </Link>
        </div>

      </div>
    </header>
  );
}