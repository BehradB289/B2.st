"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "glass" | "danger" | "luxury";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = "relative inline-flex items-center justify-center font-medium transition-all duration-200 select-none rounded-2xl active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";

  const sizeStyles = {
    sm: "px-3.5 py-2 text-xs gap-1.5",
    md: "px-5 py-3 text-sm gap-2",
    lg: "px-7 py-4 text-base font-semibold gap-2.5",
  };

  const variantStyles = {
    primary: "bg-gradient-to-r from-brand-cyan to-brand-teal text-[#090D16] font-bold shadow-neon-cyan hover:opacity-95 hover:shadow-[0_0_40px_rgba(0,242,254,0.5)]",
    luxury: "bg-luxury-btn text-white font-bold shadow-neon-violet hover:shadow-[0_0_45px_rgba(121,40,202,0.6)] border border-white/20",
    secondary: "bg-white/10 text-white hover:bg-white/15 border border-white/10 backdrop-blur-md",
    glass: "bg-white/[0.04] text-zinc-200 hover:text-white hover:bg-white/[0.08] border border-white/10 backdrop-blur-xl",
    danger: "bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30",
  };

  return (
    <button
      className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-current" />
          <span>در حال پردازش...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}