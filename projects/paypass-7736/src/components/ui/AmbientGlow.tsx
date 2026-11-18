"use client";

import React from "react";

export function AmbientGlow() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      {/* Cyan Glow - Top Left */}
      <div className="absolute -top-[15%] -left-[10%] w-[500px] h-[500px] rounded-full bg-paypass-cyan/15 blur-[140px] animate-glow-slow" />
      {/* Violet Luxury Glow - Bottom Right */}
      <div className="absolute top-[40%] -right-[15%] w-[600px] h-[600px] rounded-full bg-paypass-violet/15 blur-[160px] animate-glow-slow delay-1000" />
      {/* Central Subtle Accent */}
      <div className="absolute -bottom-[20%] left-[30%] w-[450px] h-[450px] rounded-full bg-paypass-accent/10 blur-[130px]" />
    </div>
  );
}