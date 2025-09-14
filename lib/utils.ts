import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge class names with tailwind-merge + clsx support.
 * Works with pnpm and Node 22.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Re-export utilities
export * from "./utils/validation";
export * from "./utils/upi-links";
export * from "./utils/constants";
