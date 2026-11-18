'use client';

import React from 'react';
import { Mic, Square, RotateCcw, Play, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { AudioVisualizer } from './AudioVisualizer';
import { GlassCard } from './GlassCard';

interface AudioRecorderProps {
  onAudioCaptured?: (blob: Blob) => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onAudioCaptured }) => {
  const {
    status,
    isRecording,
    formattedTime,
    audioBlob,
    audioUrl,
    analyserNode,
    errorMessage,
    startRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder();

  const handleToggle = () => {
    if (isRecording) {
      stopRecording();
      if (audioBlob && onAudioCaptured) {
        onAudioCaptured(audioBlob);
      }
    } else {
      startRecording();
    }
  };

  return (
    <GlassCard className="w-full max-w-2xl mx-auto flex flex-col gap-6">
      {/* Top Meta info */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-mono text-purple-300 uppercase tracking-wider">
            Web Audio API + Groq Whisper
          </span>
          <h3 className="text-xl font-bold text-white">ضبط صوتی صورت‌جلسه و پیش‌فاکتور</h3>
        </div>

        <div className="px-3.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white font-mono text-base font-semibold tracking-wider">
          {formattedTime}
        </div>
      </div>

      {/* Realtime Waveform Canvas */}
      <AudioVisualizer analyserNode={analyserNode} isRecording={isRecording} />

      {/* Error notification if microphone denied */}
      {errorMessage && (
        <div className="flex items-center gap-2 p-3 text-sm text-red-200 bg-red-950/40 border border-red-500/30 rounded-xl">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Recorder Action Trigger */}
      <div className="flex flex-col items-center justify-center gap-4 py-2">
        <div className="relative flex items-center justify-center">
          {/* Neon pulsating halos */}
          {isRecording && (
            <div className="absolute w-28 h-28 rounded-full bg-mesh-purple/50 animate-glow-ping pointer-events-none" />
          )}

          <button
            type="button"
            onClick={handleToggle}
            aria-label={isRecording ? 'توقف ضبط' : 'شروع ضبط'}
            className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 transform active:scale-95 shadow-xl ${
              isRecording
                ? 'bg-gradient-to-tr from-red-600 to-rose-500 shadow-[0_0_35px_rgba(239,68,68,0.6)] border-2 border-white/40'
                : 'bg-gradient-to-tr from-mesh-purple to-purple-800 hover:from-purple-600 hover:to-indigo-700 shadow-neon-purple border-2 border-white/20'
            }`}
          >
            {isRecording ? (
              <Square className="w-7 h-7 text-white fill-white transition-transform" />
            ) : (
              <Mic className="w-8 h-8 text-white transition-transform group-hover:scale-110" />
            )}
          </button>
        </div>

        <p className="text-sm text-slate-400 text-center">
          {isRecording ? (
            <span className="text-red-300 font-medium">در حال ثبت کلمات شما... برای اتمام کلیک کنید</span>
          ) : (
            <span>
              برای شروع ضبط نیازمندی‌ها، بر روی <strong>میکروفون</strong> ضربه بزنید
            </span>
          )}
        </p>
      </div>

      {/* Audio Playback & Submission row */}
      {audioUrl && !isRecording && (
        <div className="mt-2 p-4 rounded-2xl bg-black/30 border border-white/[0.08] flex flex-col md:flex-row items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs text-emerald-300 font-mono">Stream WebM آماده است</span>
              <audio src={audioUrl} controls className="h-8 max-w-full mt-1.5 opacity-90" />
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center">
            <button
              type="button"
              onClick={resetRecording}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              ضبط مجدد
            </button>
            <button
              type="button"
              onClick={() => audioBlob && onAudioCaptured?.(audioBlob)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-mesh-purple to-purple-600 hover:to-mesh-accent border border-purple-400/30 shadow-neon-purple transition-all"
            >
              <Play className="w-3.5 h-3.5" />
              ارسال به هوش مصنوعی Llama-3
            </button>
          </div>
        </div>
      )}
    </GlassCard>
  );
};