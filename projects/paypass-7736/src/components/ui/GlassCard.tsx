import React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "default" | "interactive";
}

export function GlassCard({
  children,
  className,
  variant = "default",
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.6)] transition-all duration-300",
        variant === "interactive" &&
          "hover:border-white/[0.18] hover:bg-white/[0.05] hover:shadow-[0_20px_60px_rgba(0,242,254,0.06)]",
        className
      )}
      {...props}
    >
      {/* Glossy top border highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
      {children}
    </div>
  );
}