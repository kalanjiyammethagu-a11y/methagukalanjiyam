import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a numeric currency amount in Indian Rupees (INR) with:
 * 1. Indian digit grouping (e.g. ₹1,23,456)
 * 2. Non-breaking space (\u00A0) preventing line breaks between currency symbol and digits
 * 3. Defensive NaN, null, and non-finite number guards
 */
export function formatINR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || !Number.isFinite(amount)) {
    return "₹\u00A00";
  }

  const formatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

  // Replace any standard ASCII spaces with non-breaking spaces
  return formatted.replace(/\s+/g, "\u00A0");
}
