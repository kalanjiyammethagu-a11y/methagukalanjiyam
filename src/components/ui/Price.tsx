import * as React from "react";
import { formatINR, cn } from "@/lib/utils";

export interface PriceProps {
  amount: number | null | undefined;
  originalAmount?: number | null;
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showFree?: boolean;
  freeLabel?: string;
  isTotal?: boolean;
}

/**
 * Standardized Rupee / Price Display Component:
 * - Uses Indian digit grouping and non-breaking space (₹\u00A0...)
 * - Tabular numbers (font-variant-numeric: tabular-nums) for vertical column alignment
 * - Accessible strikethrough discount MRP with clear visual hierarchy
 * - Zero amount / Free label support
 */
export function Price({
  amount,
  originalAmount,
  className,
  size = "md",
  showFree = false,
  freeLabel = "இலவசம்",
  isTotal = false,
}: PriceProps) {
  const numericAmount = Number(amount ?? 0);

  if (numericAmount === 0 && showFree) {
    return (
      <span
        className={cn(
          "font-bold text-[#0A6847] whitespace-nowrap font-tamil",
          className
        )}
      >
        {freeLabel}
      </span>
    );
  }

  const hasDiscount = Boolean(
    originalAmount && Number(originalAmount) > numericAmount
  );

  return (
    <div
      className={cn(
        "inline-flex items-baseline gap-1.5 flex-wrap font-mono whitespace-nowrap",
        isTotal ? "text-[#0A6847]" : "text-[#111111]",
        className
      )}
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      <span
        className={cn(
          "font-bold tabular-nums",
          size === "xs" && "text-xs",
          size === "sm" && "text-sm",
          size === "md" && "text-base",
          size === "lg" && "text-lg sm:text-xl",
          size === "xl" && "text-xl sm:text-2xl"
        )}
      >
        {formatINR(numericAmount)}
      </span>

      {hasDiscount && (
        <span className="text-xs text-[#666666] line-through font-normal tabular-nums">
          {formatINR(Number(originalAmount))}
        </span>
      )}
    </div>
  );
}
