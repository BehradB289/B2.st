import React from 'react';
import { Mic, Sparkles } from 'lucide-react';

interface HeaderProps {
  isRecording?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ isRecording = false }) => {
  return (
    <header className="w-full flex items-center justify-between py-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-mesh-purple to-mesh-cyan p-[1px] shadow-neon-purple flex items-center justify-center">
          <div className="w-full h-full bg-[#090D16] rounded-[11px] flex items-center justify-center text-white">
            <Sparkles className="w-5 h-5 text-mesh-accent animate-pulse" />
          </div>
        </div>
        <div>
          <span className="text-xs uppercase tracking-widest font-mono text-purple-300/80">B2.st Studio</span>
          <h2 className="text-base font-bold text-white tracking-tight">VoiceProposal</h2>
        </div>
      </div>

      <div
        className={`inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border text-xs font-mono transition-all duration-300 ${
          isRecording
            ? 'border-red-500/50 bg-red-500/10 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
            : 'border-white/10 bg-slate-900/60 text-slate-400'
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full transition-all duration-300 ${
            isRecording
              ? 'bg-red-500 shadow-[0_0_10px_#EF4444] animate-ping'
              : 'bg-emerald-500 shadow-[0_0_8px_#10B981]'
          }`}
        />
        <span>{isRecording ? 'سیگنال زنده استریم' : 'میکروفون استندبای'}</span>
      </div>
    </header>
  );
};