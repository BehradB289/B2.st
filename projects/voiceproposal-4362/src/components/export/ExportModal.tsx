'use client';

import React, { useState } from 'react';
import type { StructuredProposalData } from '@/types/export';
import { useExportManager } from '@/hooks/useExportManager';
import { ShieldCheck, Download, Sparkles, CheckCircle2, AlertCircle, Loader2, Image as ImageIcon } from 'lucide-react';

interface ExportModalProps {
  proposal: StructuredProposalData;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ proposal, isOpen, onClose }) => {
  const {
    isExporting,
    quotaRemaining,
    requiresPayment,
    pricingInfo,
    errorMessage,
    generateAndDownloadPDF,
    resetPaymentState,
  } = useExportManager();

  const [removeWatermark, setRemoveWatermark] = useState<boolean>(false);
  const [customLogoUrl, setCustomLogoUrl] = useState<string>(proposal.freelancer.logoUrl || '');
  const [mockIsPaying, setMockIsPaying] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleFreeExport = async () => {
    await generateAndDownloadPDF(proposal, {
      removeWatermark: false,
      customLogoUrl: null,
    });
  };

  const handlePayAndExport = async () => {
    setMockIsPaying(true);
    try {
      // In production: Redirect to ZarinPal/Stripe or verify authority.
      // Simulating a successful transaction confirmation callback:
      const simulatedTxId = crypto.randomUUID();
      
      const success = await generateAndDownloadPDF(proposal, {
        removeWatermark: true,
        customLogoUrl: customLogoUrl.trim() || null,
        transactionId: simulatedTxId,
      });

      if (success) {
        resetPaymentState();
        onClose();
      }
    } finally {
      setMockIsPaying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="relative w-full max-w-xl rounded-2xl border border-purple-500/30 bg-gradient-to-b from-[#090D16] to-[#140E29] p-6 text-white shadow-2xl shadow-purple-950/50">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-purple-500/20 pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-400" />
            <h2 className="text-lg font-bold">خروجی پیش‌فاکتور حقوقی (PDF)</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body Content */}
        <div className="mt-5 space-y-4 text-right">
          
          {/* Quota Indicator */}
          {quotaRemaining !== null && (
            <div className="flex items-center justify-between rounded-lg bg-purple-950/40 border border-purple-500/20 p-3 text-xs">
              <span className="text-purple-300">سهمیه خروجی استاندارد باقی‌مانده:</span>
              <span className="font-bold text-purple-400">{quotaRemaining} از ۳</span>
            </div>
          )}

          {/* Feature toggles */}
          <div className="space-y-3 rounded-xl bg-white/[0.03] p-4 border border-white/5">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={removeWatermark}
                  onChange={(e) => setRemoveWatermark(e.target.checked)}
                  className="rounded border-gray-700 bg-gray-900 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm font-medium">حذف کامل برچسب و واترمارک VoiceProposal</span>
              </div>
              <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">ویژه</span>
            </label>

            <div className="pt-2 border-t border-white/5">
              <label className="block text-xs font-medium text-gray-300 mb-1">
                آدرس لینک لوگوی اختصاصی فریلنسر (PNG/SVG):
              </label>
              <div className="relative">
                <input
                  type="url"
                  placeholder="https://example.com/my-agency-logo.png"
                  value={customLogoUrl}
                  onChange={(e) => setCustomLogoUrl(e.target.value)}
                  className="w-full rounded-lg bg-black/40 border border-purple-500/30 px-3 py-2 text-xs text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                />
                <ImageIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              </div>
            </div>
          </div>

          {/* Payment Prompt if Quota Exceeded or Pro Feature Checked */}
          {(requiresPayment || removeWatermark || customLogoUrl.trim().length > 0) && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm mb-1">
                <AlertCircle className="h-4 w-4" />
                <span>پلن Pay-per-Export استودیو</span>
              </div>
              <p className="text-xs text-gray-300 leading-5">
                برای خروجی با لوگوی اختصاصی و بدون واترمارک، نیاز به پرداخت هزینه زیرساخت و اعتبارسنجی حقوقی دارید.
              </p>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-gray-400">مبلغ قابل پرداخت:</span>
                <span className="font-bold text-emerald-400">
                  {pricingInfo ? (pricingInfo.amount / 10).toLocaleString() : '۴۹,۰۰۰'} تومان
                </span>
              </div>
            </div>
          )}

          {errorMessage && (
            <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded p-2">
              {errorMessage}
            </p>
          )}
        </div>

        {/* Modal Actions */}
        <div className="mt-6 flex flex-col gap-2">
          {removeWatermark || customLogoUrl.trim().length > 0 || requiresPayment ? (
            <button
              onClick={handlePayAndExport}
              disabled={isExporting || mockIsPaying}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-600/30 hover:brightness-110 active:scale-[0.99] transition disabled:opacity-50"
            >
              {mockIsPaying || isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>در حال پرداخت و کامپایل PDF...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>پرداخت امن و دریافت PDF پریمیوم</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleFreeExport}
              disabled={isExporting}
              className="flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 py-3 text-sm font-semibold text-white active:scale-[0.99] transition disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>در حال ایجاد سند کلاینت...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>دانلود رایگان (همراه با برچسب استودیو)</span>
                </>
              )}
            </button>
          )}

          <div className="flex items-center justify-center gap-1 text-[11px] text-gray-500 pt-2">
            <CheckCircle2 className="h-3 w-3 text-purple-400" />
            <span>رندر ۱۰۰٪ محلی در مرورگر شما بدون ارسال اطلاعات قرارداد به سرور ثالث</span>
          </div>
        </div>
      </div>
    </div>
  );
};