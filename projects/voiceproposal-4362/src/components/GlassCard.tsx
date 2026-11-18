import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`relative backdrop-blur-xl bg-white/[0.04] border border-white/[0.09] shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] rounded-3xl p-6 md:p-8 overflow-hidden transition-all duration-300 before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent ${className}`}
    >
      {children}
    </div>
  );
};