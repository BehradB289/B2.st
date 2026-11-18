"use client";

import React from "react";

export function AmbientBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Background base mesh */}
      <div className="absolute inset-0 bg-[#090D16]" />

      {/* Cyber Cyan Ambient Glow (Top Left) */}
      <div 
        className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] rounded-full bg-brand-cyan/15 blur-[130px] animate-ambient-drift mix-blend-screen"
        style={{ animationDuration: "22s" }}
      />

      {/* Deep Violet Ambient Glow (Bottom Right) */}
      <div 
        className="absolute -bottom-[20%] -right-[10%] w-[650px] h-[650px] rounded-full bg-brand-violet/20 blur-[150px] animate-ambient-drift mix-blend-screen"
        style={{ animationDuration: "26s", animationDirection: "reverse" }}
      />

      {/* Central Accent Glow (Pink/Violet) */}
      <div 
        className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full bg-brand-pink/10 blur-[140px] animate-pulse-slow"
      />

      {/* Subtle Studio Luxury Grid Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.035]" 
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
          backgroundSize: "32px 32px"
        }}
      />
    </div>
  );
}