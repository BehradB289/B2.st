"use client";

import React, { useState } from "react";
import { ItemPublicView, DecryptedPayload } from "@/types";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { processUnlockAction } from "@/actions/paypass";
import { formatCurrency } from "@/lib/utils";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Lock, 
  Unlock, 
  Sparkles, 
  Check, 
  Copy, 
  ExternalLink, 
  ShieldCheck, 
  Clock, 
  FileCheck2,
  AlertCircle 
} from "lucide-react";

interface BuyerUnlockViewProps {
  item: ItemPublicView;
}

export function BuyerUnlockView({ item }: BuyerUnlockViewProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [unlockedData, setUnlockedData] = useState<DecryptedPayload | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Trigger luxury celebration particle effect on unlock
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#00F2FE", "#4FACFE", "#7928CA", "#FFFFFF"],
      });
    } catch {
      // safe fallback if canvas is restricted
    }
  };

  const handleSimulatePaymentAndUnlock = async () => {
    setErrorMsg(null);
    setIsProcessing(true);

    try {
      const res = await processUnlockAction(item.slug);

      if (res.success && res.data) {
        setUnlockedData(res.data);
        triggerConfetti();
      } else {
        setErrorMsg(res.error || "پرداخت یا رمزگشایی تایید نشد.");
      }
    } catch {
      setErrorMsg("خطای غیرمنتظره در ارتباط با پایانه پرداخت.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyContent = () => {
    if (!unlockedData?.unlockedContent) return;
    navigator.clipboard.writeText(unlockedData.unlockedContent);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const isLinkContent =
    unlockedData?.unlockedContent?.startsWith("http://") ||
    unlockedData?.unlockedContent?.startsWith("https://");

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-8">
      <AnimatePresence mode="wait">
        {!unlockedData ? (
          /* ========================================================= */
          /* PRE-PURCHASE LOCKED STATE (Glassmorphic Luxury Paywall)   */
          /* ========================================================= */
          <motion.div
            key="locked-card"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <GlassCard className="p-7 sm:p-9 border-white/15 bg-gradient-to-b from-white/[0.05] via-[#090D16]/90 to-[#090D16] shadow-2xl relative">
              
              {/* Floating lock badge */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-cyan/20 to-brand-violet/20 border border-white/20 backdrop-blur-2xl flex items-center justify-center text-brand-cyan shadow-neon-cyan">
                    <Lock className="w-9 h-9" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#090D16] border border-white/20 flex items-center justify-center text-emerald-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold tracking-wider text-brand-cyan uppercase bg-brand-cyan/10 px-3 py-1 rounded-full border border-brand-cyan/20">
                    محتوای قفل شده با AES-256
                  </span>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-white leading-snug">
                    {item.title}
                  </h1>
                </div>

                {item.description && (
                  <p className="text-xs sm:text-sm text-zinc-400 max-w-md leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>

              {/* Frosted Blurred Secret Preview Window */}
              <div className="my-6 relative rounded-2xl overflow-hidden border border-white/10 bg-black/40 p-5 text-center">
                <div className="select-none filter blur-md opacity-40 text-xs font-mono text-zinc-300 leading-relaxed pointer-events-none">
                  {`https://t.me/vip_exclusive_vault_protected_token_aes_256_cipher_content_payload_` +
                    `prompt_secret_key_882947192847291048291047281`}
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]">
                  <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5 bg-[#090D16]/80 px-3 py-1.5 rounded-full border border-white/10">
                    <Sparkles className="w-3.5 h-3.5 text-brand-cyan" />
                    <span>پس از پرداخت فوراً آنلاک و تحویل داده می‌شود</span>
                  </span>
                </div>
              </div>

              {/* Price & Guarantee details */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <Clock className="w-4 h-4 text-zinc-500" />
                  <span>تحویل دیجیتال آنی</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-zinc-400 block">مبلغ قابل پرداخت:</span>
                  <span className="text-xl font-black text-white font-mono">
                    {formatCurrency(item.price)}
                  </span>
                </div>
              </div>

              {/* Error feedback if any */}
              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Instant Purchase Action Button */}
              <Button
                variant="luxury"
                size="lg"
                isLoading={isProcessing}
                onClick={handleSimulatePaymentAndUnlock}
                className="w-full text-base font-bold shadow-neon-cyan"
              >
                <span>پرداخت و آنلاک فوری محتوا</span>
                <Unlock className="w-5 h-5" />
              </Button>

              <div className="mt-4 flex items-center justify-center gap-3 text-[11px] text-zinc-500">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> درگاه شتابی شاپرک
                </span>
                <span>•</span>
                <span>تضمین سلامت تراکنش استودیو B2.st</span>
              </div>

            </GlassCard>
          </motion.div>
        ) : (
          /* ========================================================= */
          /* POST-PURCHASE UNLOCKED STATE (Decrypted Instant Access)   */
          /* ========================================================= */
          <motion.div
            key="unlocked-card"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4, type: "spring" }}
          >
            <GlassCard className="p-7 sm:p-9 border-brand-cyan/40 bg-gradient-to-b from-brand-cyan/[0.07] via-[#090D16]/95 to-[#090D16] shadow-neon-cyan/20">
              
              {/* Success Badge */}
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto shadow-[0_0_25px_rgba(16,185,129,0.3)]">
                  <Unlock className="w-8 h-8 text-emerald-300" />
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    پرداخت تایید شد • محتوا آزاد شد
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    {unlockedData.title}
                  </h2>
                </div>
              </div>

              {/* Decrypted Payload Display Box */}
              <div className="my-6 p-5 rounded-2xl bg-[#090D16] border border-brand-cyan/30 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between text-xs text-zinc-400 pb-2 border-b border-white/10">
                  <span className="flex items-center gap-1.5 font-medium text-brand-cyan">
                    <FileCheck2 className="w-4 h-4" />
                    محتوای خریداری‌شده شما:
                  </span>
                  <span className="font-mono text-[11px] text-zinc-500">
                    کد رهگیری: {unlockedData.refId}
                  </span>
                </div>

                <div 
                  className="w-full max-h-56 overflow-y-auto p-3.5 rounded-xl bg-white/[0.02] border border-white/5 font-mono text-sm text-zinc-100 select-all break-all leading-relaxed"
                  dir={isLinkContent ? "ltr" : "auto"}
                >
                  {unlockedData.unlockedContent}
                </div>

                {/* Direct Action based on type */}
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleCopyContent}
                    className="flex-1"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-4 h-4 text-[#090D16]" />
                        <span>با موفقیت کپی شد!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-[#090D16]" />
                        <span>کپی محتوا در کلیپ‌بورد</span>
                      </>
                    )}
                  </Button>

                  {isLinkContent && (
                    <a
                      href={unlockedData.unlockedContent}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/15 transition-colors"
                    >
                      <span>باز کردن لینک</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

              {/* Footer info */}
              <div className="text-center pt-2">
                <p className="text-xs text-zinc-500">
                  این دسترسی رمزگشایی شده برای شما امن و دائمی است. زمان تراکنش: {unlockedData.paidAt}
                </p>
              </div>

            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}