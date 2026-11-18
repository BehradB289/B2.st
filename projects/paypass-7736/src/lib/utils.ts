import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format numbers with Persian comma separation
 */
export function formatCurrency(amount: number, currency: "toman" | "usd" = "toman"): string {
  if (currency === "usd") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  }

  return new Intl.NumberFormat("fa-IR").format(amount) + " تومان";
}

/**
 * Standard IRAN IBAN (Sheba) Validator
 */
export function validateSheba(sheba: string): boolean {
  const clean = sheba.replace(/[\s-]/g, "").toUpperCase();
  if (!/^IR\d{24}$/.test(clean)) {
    return false;
  }
  return true;
}

/**
 * Generate human-friendly randomized URL slug
 */
export function generateSlug(): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let result = "";
  for (let i = 0; i < 7; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}