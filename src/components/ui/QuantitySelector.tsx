"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuantitySelectorProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  locale?: "ta" | "en";
  size?: "sm" | "md";
  className?: string;
}

export function QuantitySelector({
  value,
  min = 1,
  max = 99,
  onChange,
  locale = "ta",
  size = "md",
  className,
}: QuantitySelectorProps) {
  const decrement = () => {
    if (value > min) onChange(value - 1);
  };

  const increment = () => {
    if (value < max) onChange(value + 1);
  };

  const btnSize = size === "sm"
    ? "min-h-[36px] min-w-[36px] h-8 w-8"
    : "min-h-[44px] min-w-[44px] h-10 w-10";

  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <div
      className={cn("inline-flex items-center gap-0 rounded-xl border border-black/12 bg-white overflow-hidden", className)}
      role="group"
      aria-label={locale === "ta" ? "எண்ணிக்கை தேர்வி" : "Quantity selector"}
    >
      <button
        type="button"
        onClick={decrement}
        disabled={value <= min}
        aria-label={locale === "ta" ? "குறைக்கவும்" : "Decrease quantity"}
        className={cn(
          btnSize,
          "flex items-center justify-center text-[#333333] hover:bg-black/5 hover:text-[#0A6847] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
        )}
      >
        <Minus className={iconSize} />
      </button>

      <span
        className={cn(
          "flex items-center justify-center font-bold text-[#111111] select-none tabular-nums",
          size === "sm" ? "w-8 text-sm" : "w-10 text-base"
        )}
        aria-live="polite"
        aria-atomic="true"
      >
        {value}
      </span>

      <button
        type="button"
        onClick={increment}
        disabled={value >= max}
        aria-label={locale === "ta" ? "அதிகரிக்கவும்" : "Increase quantity"}
        className={cn(
          btnSize,
          "flex items-center justify-center text-[#333333] hover:bg-black/5 hover:text-[#0A6847] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
        )}
      >
        <Plus className={iconSize} />
      </button>
    </div>
  );
}
