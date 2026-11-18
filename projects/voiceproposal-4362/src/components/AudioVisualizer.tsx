'use client';

import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  analyserNode: AnalyserNode | null;
  isRecording: boolean;
  className?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  analyserNode,
  isRecording,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let dataArray: Uint8Array;

    if (analyserNode) {
      const bufferLength = analyserNode.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);
    }

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const render = () => {
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      ctx.clearRect(0, 0, width, height);

      if (isRecording && analyserNode && dataArray) {
        analyserNode.getByteTimeDomainData(dataArray);

        // Neon Glow effect for live recording
        ctx.shadowBlur = 14;
        ctx.shadowColor = 'rgba(139, 92, 246, 0.7)';

        ctx.lineWidth = 2.5;
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, '#6D28D9');
        gradient.addColorStop(0.3, '#06B6D4');
        gradient.addColorStop(0.7, '#A78BFA');
        gradient.addColorStop(1, '#6D28D9');
        ctx.strokeStyle = gradient;

        ctx.beginPath();
        const sliceWidth = width / dataArray.length;
        let x = 0;

        for (let i = 0; i < dataArray.length; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.lineTo(width, height / 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else {
        // Idle decorative sine wave
        ctx.lineWidth = 1.8;
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, 'rgba(109, 40, 217, 0.15)');
        gradient.addColorStop(0.5, 'rgba(6, 182, 212, 0.45)');
        gradient.addColorStop(1, 'rgba(109, 40, 217, 0.15)');
        ctx.strokeStyle = gradient;

        ctx.beginPath();
        const sliceWidth = width / 100;
        let x = 0;
        const time = Date.now() * 0.0025;

        for (let i = 0; i <= 100; i++) {
          const y = height / 2 + Math.sin(i * 0.09 + time) * 6;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }

        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [analyserNode, isRecording]);

  return (
    <div className={`relative w-full h-32 rounded-2xl bg-[#090D16]/80 border border-white/[0.06] overflow-hidden ${className}`}>
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};