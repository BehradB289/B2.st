"use client";

import React, { useMemo } from "react";
import type { ProposalData, MilestonePhase } from "@/types/proposal";
import { DownloadPdfButton } from "./pdf/DownloadPdfButton";
import {
  Calendar,
  CheckCircle,
  Clock,
  Coins,
  FileCheck2,
  Layers,
  ShieldAlert,
  Sparkles,
  User,
} from "lucide-react";

interface ProposalViewerProps {
  proposal: ProposalData;
}

const statusBadgeClasses: Record<MilestonePhase["status"], string> = {
  pending: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  in_progress: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
  completed: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]",
  approved: "bg-[#10B981]/20 text-[#10B981] border-[#10B981]/40 shadow-[0_0_15px_rgba(16,185,129,0.25)]",
};

export const ProposalViewer: React.FC<ProposalViewerProps> = ({ proposal }) => {
  const currencySymbol = useMemo(() => {
    switch (proposal.pricing.currency) {
      case "USD":
        return "$";
      case "EUR":
        return "€";
      case "IRR":
        return "IRR ";
      case "TOMAN":
        return "Toman ";
      default:
        return `${proposal.pricing.currency} `;
    }
  }, [proposal.pricing.currency]);

  const formatPrice = (val: number) => {
    return `${currencySymbol}${val.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="relative min-h-screen bg-[#090D16] text-slate-100 selection:bg-violet-600/30 selection:text-violet-200 antialiased py-10 px-4 sm:px-6 lg:px-8">
      {/* Background Mesh Gradient Glows */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden z-0"
        aria-hidden="true"
      >
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#6D28D9]/15 blur-[120px] mix-blend-screen" />
        <div className="absolute top-[30%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-indigo-900/15 blur-[140px] mix-blend-screen" />
        <div className="absolute bottom-[-5%] left-[25%] w-[40vw] h-[40vw] rounded-full bg-[#10B981]/10 blur-[130px] mix-blend-screen" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto space-y-8">
        {/* Top Control Bar with Glassmorphism */}
        <header className="backdrop-blur-xl bg-slate-900/40 border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/10 border border-violet-500/20 text-violet-300">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                <span>AI Voice Synthesis Verified</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
                {proposal.title}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 flex items-center gap-2">
                <span>Ref:</span>
                <span className="font-mono text-slate-200 bg-slate-800/80 px-2 py-0.5 rounded border border-white/5">
                  {proposal.proposalNumber}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Valid till: {proposal.validUntil}
                </span>
              </p>
            </div>

            <div className="flex items-center self-start md:self-center">
              <DownloadPdfButton proposal={proposal} />
            </div>
          </div>
        </header>

        {/* Counterparty Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <section className="backdrop-blur-lg bg-slate-900/30 border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-violet-600/10 border border-violet-500/20 text-violet-400">
                <User className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Client / Contractee
                </span>
                <h3 className="text-base font-semibold text-white">
                  {proposal.client.name}
                </h3>
              </div>
            </div>
            <div className="space-y-1 text-sm text-slate-300 pl-11">
              <p className="text-slate-400">{proposal.client.company}</p>
              <p className="font-mono text-xs text-slate-400">{proposal.client.email}</p>
            </div>
          </section>

          <section className="backdrop-blur-lg bg-slate-900/30 border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Freelance Provider
                </span>
                <h3 className="text-base font-semibold text-white">
                  {proposal.provider.name}
                </h3>
              </div>
            </div>
            <div className="space-y-1 text-sm text-slate-300 pl-11">
              <p className="text-slate-400">{proposal.provider.title}</p>
              <p className="font-mono text-xs text-slate-400">{proposal.provider.email}</p>
            </div>
          </section>
        </div>

        {/* Executive Summary */}
        <section className="backdrop-blur-lg bg-slate-900/35 border border-white/5 rounded-2xl p-6 sm:p-7">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-violet-400" />
            Executive Scope & Intent
          </h2>
          <p className="text-slate-200 text-sm sm:text-base leading-relaxed bg-black/20 p-4 rounded-xl border border-white/5 font-normal">
            {proposal.summary}
          </p>
        </section>

        {/* Milestone Phases with Emerald Glass Badges */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-400" />
              Delivery Milestones & Execution Phases
            </h2>
            <span className="text-xs text-slate-400">
              Total {proposal.phases.length} Phases
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {proposal.phases.map((phase, idx) => (
              <div
                key={phase.id || idx}
                className="backdrop-blur-md bg-slate-900/40 border border-white/5 hover:border-emerald-500/30 rounded-2xl p-5 sm:p-6 transition-all duration-300 group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded">
                        PHASE 0{idx + 1}
                      </span>
                      <h3 className="text-base font-semibold text-white group-hover:text-emerald-200 transition-colors">
                        {phase.title}
                      </h3>
                    </div>
                    <span className="text-xs text-slate-400 block pl-1">
                      Target Timeframe: {phase.duration}
                    </span>
                  </div>

                  {/* Emerald Glass Badge */}
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md border ${
                        statusBadgeClasses[phase.status]
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {phase.status.toUpperCase()}
                    </span>
                    <span className="font-mono text-sm font-semibold text-slate-200">
                      {formatPrice(phase.amount)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    Key Deliverables:
                  </span>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {phase.deliverables.map((del, dIdx) => (
                      <li
                        key={dIdx}
                        className="flex items-start gap-2 text-xs sm:text-sm text-slate-300 bg-slate-950/30 p-2.5 rounded-lg border border-white/5"
                      >
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{del}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing & Line Items Table */}
        <section className="backdrop-blur-xl bg-slate-900/40 border border-white/10 rounded-2xl p-6 sm:p-8 overflow-hidden shadow-2xl">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Coins className="w-5 h-5 text-indigo-400" />
            Pricing Matrix & Financial Allocation
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th scope="col" className="py-3 px-4">Description</th>
                  <th scope="col" className="py-3 px-4 text-center">Quantity</th>
                  <th scope="col" className="py-3 px-4 text-right">Unit Rate</th>
                  <th scope="col" className="py-3 px-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {proposal.lineItems.map((item, index) => (
                  <tr
                    key={item.id || index}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3.5 px-4 text-slate-200 font-medium">
                      {item.description}
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-400 font-mono">
                      {item.quantity}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-300 font-mono">
                      {formatPrice(item.unitPrice)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-white font-mono font-semibold">
                      {formatPrice(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pricing Totals Section */}
          <div className="mt-8 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="space-y-1.5 max-w-sm">
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                Payment Schedule
              </span>
              <p className="text-xs text-slate-300 bg-slate-950/40 p-3 rounded-xl border border-white/5">
                {proposal.pricing.paymentTerms}
              </p>
            </div>

            <div className="w-full md:w-72 space-y-2 bg-slate-950/50 p-4 rounded-xl border border-white/5">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Subtotal:</span>
                <span className="font-mono text-slate-200">
                  {formatPrice(proposal.pricing.subtotal)}
                </span>
              </div>
              {proposal.pricing.discountAmount > 0 && (
                <div className="flex justify-between text-xs text-emerald-400">
                  <span>Discount:</span>
                  <span className="font-mono">
                    -{formatPrice(proposal.pricing.discountAmount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-xs text-slate-400">
                <span>Tax ({proposal.pricing.taxRate}%):</span>
                <span className="font-mono text-slate-200">
                  {formatPrice(proposal.pricing.taxAmount)}
                </span>
              </div>
              <div className="pt-2 border-t border-white/10 flex justify-between items-center text-sm">
                <span className="font-bold text-white">Grand Total:</span>
                <span className="font-mono font-extrabold text-base sm:text-lg text-violet-300">
                  {formatPrice(proposal.pricing.total)}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Legal Terms & Force Majeure */}
        <section className="backdrop-blur-lg bg-slate-900/30 border border-white/5 rounded-2xl p-6 sm:p-7 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            Legal Framework & Force Majeure
          </h2>

          <div className="space-y-2.5">
            {proposal.legalTerms.map((term, index) => (
              <div
                key={index}
                className="text-xs text-slate-300 bg-black/20 p-3 rounded-lg border-l-2 border-violet-500/70"
              >
                {term}
              </div>
            ))}

            <div className="text-xs text-rose-200/90 bg-rose-950/20 p-3.5 rounded-lg border-l-2 border-rose-500/80 mt-3">
              <span className="font-bold uppercase tracking-wider text-rose-400 mr-2">
                Force Majeure Clause:
              </span>
              {proposal.forceMajeure}
            </div>
          </div>
        </section>

        {/* Footer sticky bar for convenient access on mobile */}
        <footer className="sticky bottom-4 z-40 backdrop-blur-xl bg-slate-900/70 border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4 md:hidden">
          <div>
            <span className="text-[10px] uppercase text-slate-400 block font-medium">
              Grand Total
            </span>
            <span className="font-mono font-bold text-sm text-violet-300">
              {formatPrice(proposal.pricing.total)}
            </span>
          </div>
          <DownloadPdfButton proposal={proposal} className="w-full sm:w-auto" />
        </footer>
      </div>
    </div>
  );
};