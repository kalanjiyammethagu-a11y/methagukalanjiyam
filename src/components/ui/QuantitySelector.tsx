"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface QuantitySelectorProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  locale?: "ta" | "en";
  size?: "sm" | "md";
  className?: string;
  disabled?: boolean;
}

/**
 * Touch-optimized Quantity Stepper:
 * - Meets WCAG 2.5.5 minimum 44x44px touch target requirement on all screen sizes
 * - Direct numeric input with inputmode="numeric" and pattern="[0-9]*"
 * - touch-action: manipulation to eliminate mobile 300ms double-tap zoom delay
 * - Clear active, focus-visible, and disabled states
 */
export function QuantitySelector({
  value,
  min = 1,
  max = 99,
  onChange,
  locale = "ta",
  size = "md",
  className,
  disabled = false,
}: QuantitySelectorProps) {
  const [inputValue, setInputValue] = React.useState<string>(String(value));

  // Sync internal input state when prop changes
  React.useEffect(() => {
    setInputValue(String(value));
  }, [value]);

  const clampAndDispatch = React.useCallback(
    (targetVal: number) => {
      const clamped = Math.max(min, Math.min(max, targetVal));
      setInputValue(String(clamped));
      if (clamped !== value) {
        onChange(clamped);
      }
    },
    [min, max, value, onChange]
  );

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    if (disabled || value <= min) return;
    clampAndDispatch(value - 1);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    if (disabled || value >= max) return;
    clampAndDispatch(value + 1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    setInputValue(raw);
  };

  const handleInputBlur = () => {
    const parsed = parseInt(inputValue, 10);
    if (Number.isNaN(parsed) || parsed < min) {
      clampAndDispatch(min);
    } else if (parsed > max) {
      clampAndDispatch(max);
    } else {
      clampAndDispatch(parsed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      clampAndDispatch(value + 1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      clampAndDispatch(value - 1);
    }
  };

  const isTa = locale === "ta";

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-xl border border-black/15 dark:border-white/15 bg-white dark:bg-[#1a1918] shadow-2xs select-none",
        size === "sm" ? "h-11" : "h-11",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
      role="group"
      aria-label={isTa ? "எண்ணிக்கை தேர்வி" : "Quantity selector"}
    >
      {/* Decrement Button - Guaranteed >= 44x44px touch target */}
      <button
        type="button"
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        aria-label={
          isTa
            ? `எண்ணிக்கையை குறைக்க (தற்போது: ${value})`
            : `Decrease quantity (currently ${value})`
        }
        className={cn(
          "min-h-[44px] min-w-[44px] h-11 w-11 flex items-center justify-center text-[#333333] dark:text-[#cccccc] hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 active:bg-black/10 focus-visible:ring-2 focus-visible:ring-[#0A6847] focus-visible:outline-none transition-all cursor-pointer rounded-l-xl",
          (disabled || value <= min) && "opacity-30 cursor-not-allowed active:scale-100"
        )}
        style={{ touchAction: "manipulation" }}
      >
        <Minus className="h-4 w-4 stroke-[2.2]" />
      </button>

      {/* Editable Numeric Input */}
      <div className="relative flex items-center justify-center px-1">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          aria-label={isTa ? "புத்தக எண்ணிக்கை" : "Quantity"}
          className={cn(
            "w-10 sm:w-12 h-9 text-center font-bold text-[#111111] dark:text-white bg-transparent border-0 outline-none tabular-nums font-mono text-sm sm:text-base focus:ring-1 focus:ring-[#0A6847] rounded-md",
            size === "sm" ? "text-sm" : "text-base"
          )}
          style={{ touchAction: "manipulation", fontVariantNumeric: "tabular-nums" }}
        />
      </div>

      {/* Increment Button - Guaranteed >= 44x44px touch target */}
      <button
        type="button"
        onClick={handleIncrement}
        disabled={disabled || value >= max}
        aria-label={
          isTa
            ? `எண்ணிக்கையை அதிகரிக்க (தற்போது: ${value})`
            : `Increase quantity (currently ${value})`
        }
        className={cn(
          "min-h-[44px] min-w-[44px] h-11 w-11 flex items-center justify-center text-[#333333] dark:text-[#cccccc] hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 active:bg-black/10 focus-visible:ring-2 focus-visible:ring-[#0A6847] focus-visible:outline-none transition-all cursor-pointer rounded-r-xl",
          (disabled || value >= max) && "opacity-30 cursor-not-allowed active:scale-100"
        )}
        style={{ touchAction: "manipulation" }}
      >
        <Plus className="h-4 w-4 stroke-[2.2]" />
      </button>
    </div>
  );
}
