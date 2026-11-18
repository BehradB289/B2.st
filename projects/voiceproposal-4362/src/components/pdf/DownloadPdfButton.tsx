"use client";

import React, { useState, useEffect } from "react";
import type { ProposalData } from "@/types/proposal";
import { Download, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface DownloadPdfButtonProps {
  proposal: ProposalData;
  className?: string;
}

type RenderState = "idle" | "rendering" | "ready" | "error";

export const DownloadPdfButton: React.FC<DownloadPdfButtonProps> = ({
  proposal,
  className = "",
}) => {
  const [mounted, setMounted] = useState<boolean>(false);
  const [status, setStatus] = useState<RenderState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDownload = async () => {
    if (status === "rendering") return;

    setStatus("rendering");
    setErrorMessage(null);

    try {
      // Lazy load @react-pdf/renderer and ProposalDocument on client only
      const [{ pdf }, { ProposalDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/pdf/ProposalDocument"),
      ]);

      const doc = <ProposalDocument data={proposal} />;
      const asPdf = pdf(doc);
      const blob = await asPdf.toBlob();

      const blobUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const safeFilename = `Proposal_${proposal.proposalNumber.replace(/[^a-zA-Z0-9-_]/g, "_")}.pdf`;

      anchor.href = blobUrl;
      anchor.download = safeFilename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      // Free memory
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);

      setStatus("ready");
      setTimeout(() => setStatus("idle"), 3500);
    } catch (err: unknown) {
      console.error("PDF client-side render failure:", err);
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "PDF creation failed");
      setTimeout(() => setStatus("idle"), 5000);
    }
  };

  if (!mounted) {
    return (
      <div
        className={`relative inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-xs font-semibold uppercase tracking-wider text-slate-400 bg-slate-900/60 border border-white/5 opacity-70 ${className}`}
      >
        Initializing Engine...
      </div>
    );
  }

  return (
    <div className="relative inline-flex flex-col items-center">
      <button
        type="button"
        onClick={handleDownload}
        disabled={status === "rendering"}
        className={`group relative overflow-hidden inline-flex items-center justify-center gap-3 px-7 py-3.5 rounded-xl font-medium text-sm text-white transition-all duration-300 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed ${
          status === "error"
            ? "bg-rose-950/40 border border-rose-500/50 text-rose-200"
            : "bg-gradient-to-r from-violet-600/80 via-purple-600/80 to-indigo-600/80 hover:from-violet-500 hover:to-indigo-500 border border-violet-400/30 shadow-[0_0_25px_rgba(109,40,217,0.35)] hover:shadow-[0_0_35px_rgba(109,40,217,0.6)]"
        } backdrop-blur-md ${className}`}
      >
        {/* Acrylic Edge Sheen Reflex Light Effect */}
        <span
          className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl"
          aria-hidden="true"
        >
          <span className="absolute -inset-x-full top-0 h-full w-[200%] bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out" />
          <span className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-violet-300/60 to-transparent" />
          <span className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent" />
        </span>

        {/* State Indicators */}
        {status === "idle" && (
          <>
            <Download className="w-4 h-4 text-violet-200 group-hover:-translate-y-0.5 transition-transform duration-200" />
            <span className="tracking-wide">Download Official PDF</span>
          </>
        )}

        {status === "rendering" && (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-violet-300" />
            <span className="tracking-wide text-violet-200">
              Zero-Server Rendering...
            </span>
          </>
        )}

        {status === "ready" && (
          <>
            <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-in zoom-in-50 duration-200" />
            <span className="tracking-wide text-emerald-300">
              PDF Dispatched!
            </span>
          </>
        )}

        {status === "error" && (
          <>
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span className="tracking-wide text-rose-300">Retry Download</span>
          </>
        )}
      </button>

      {errorMessage && (
        <span className="absolute -bottom-5 text-[10px] text-rose-400 font-mono tracking-tight animate-pulse">
          {errorMessage}
        </span>
      )}
    </div>
  );
};