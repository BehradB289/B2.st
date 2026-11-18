'use client';

import { useState, useCallback, useEffect } from 'react';
import { pdf } from '@react-pdf/renderer';
import React from 'react';
import type { StructuredProposalData, ExportTokenClaims, ExportTokenResponse } from '@/types/export';
import { ProposalPDFDocument } from '@/components/pdf/ProposalPDFDocument';

interface UseExportManagerReturn {
  isExporting: boolean;
  quotaRemaining: number | null;
  requiresPayment: boolean;
  pricingInfo: ExportTokenResponse['pricing'] | null;
  errorMessage: string | null;
  generateAndDownloadPDF: (
    proposal: StructuredProposalData,
    options?: {
      removeWatermark?: boolean;
      customLogoUrl?: string | null;
      transactionId?: string | null;
    }
  ) => Promise<boolean>;
  resetPaymentState: () => void;
}

export function useExportManager(): UseExportManagerReturn {
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [quotaRemaining, setQuotaRemaining] = useState<number | null>(null);
  const [requiresPayment, setRequiresPayment] = useState<boolean>(false);
  const [pricingInfo, setPricingInfo] = useState<ExportTokenResponse['pricing'] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fingerprint, setFingerprint] = useState<string>('');

  // Generate or retrieve persistent browser device fingerprint
  useEffect(() => {
    let fp = localStorage.getItem('vp_device_fingerprint');
    if (!fp) {
      fp = 'vp_fp_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      localStorage.setItem('vp_device_fingerprint', fp);
    }
    setFingerprint(fp);
  }, []);

  const resetPaymentState = useCallback(() => {
    setRequiresPayment(false);
    setPricingInfo(null);
    setErrorMessage(null);
  }, []);

  const generateAndDownloadPDF = useCallback(
    async (
      proposal: StructuredProposalData,
      options?: {
        removeWatermark?: boolean;
        customLogoUrl?: string | null;
        transactionId?: string | null;
      }
    ): Promise<boolean> => {
      setIsExporting(true);
      setErrorMessage(null);

      try {
        // Request token from edge API
        const response = await fetch('/api/export-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            proposalId: proposal.id,
            fingerprint: fingerprint || 'unknown-device-fingerprint',
            customLogoUrl: options?.customLogoUrl || null,
            removeWatermarkRequested: options?.removeWatermark || false,
            transactionId: options?.transactionId || null,
          }),
        });

        const result: ExportTokenResponse = await response.json();

        if (response.status === 402 || result.requiresPayment) {
          setRequiresPayment(true);
          setPricingInfo(result.pricing || null);
          setErrorMessage(result.error || 'نیازمند پرداخت جهت خروجی حرفه‌ای');
          setIsExporting(false);
          return false;
        }

        if (!response.ok || !result.success || !result.token) {
          throw new Error(result.error || 'خطا در دریافت مجوز خروجی');
        }

        if (typeof result.quotaRemaining === 'number') {
          setQuotaRemaining(result.quotaRemaining);
        }

        // Parse claims directly from JWT without edge secret (just decoding base64 payload in browser)
        const tokenParts = result.token.split('.');
        const payloadJson = atob(tokenParts[1]);
        const claims: ExportTokenClaims = JSON.parse(payloadJson);

        const shouldRenderWatermark = !claims.watermarkDisabled;
        const activeLogo = claims.customLogoAllowed ? claims.customLogoUrl : null;

        // Render client-side zero-server-cost PDF
        const docElement = React.createElement(ProposalPDFDocument, {
          data: proposal,
          watermarkEnabled: shouldRenderWatermark,
          customLogoUrl: activeLogo,
        });

        const blob = await pdf(docElement).toBlob();
        const url = URL.createObjectURL(blob);

        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `Proposal-${proposal.projectTitle.replace(/\s+/g, '_')}-${proposal.id.slice(0, 6)}.pdf`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);

        return true;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'خطای پیش‌بینی‌نشده در ایجاد فایل PDF';
        setErrorMessage(msg);
        return false;
      } finally {
        setIsExporting(false);
      }
    },
    [fingerprint]
  );

  return {
    isExporting,
    quotaRemaining,
    requiresPayment,
    pricingInfo,
    errorMessage,
    generateAndDownloadPDF,
    resetPaymentState,
  };
}