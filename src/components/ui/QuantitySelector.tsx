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
 * - Direct numeric input with inputMode="numeric" and pattern="[0-9]*"
 * - Theme-aware surface & explicit high-contrast text (including -webkit-text-fill-color for iOS Safari)
 * - touch-action: manipulation to eliminate mobile 300ms double-tap zoom delay
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
        "inline-flex w-fit shrink-0 items-center rounded-xl select-none border shadow-2xs transition-colors",
        "bg-white border-black/15 text-[#111111]",
        "dark:bg-[#1a1918] dark:border-white/20 dark:text-white",
        size === "sm" ? "h-11" : "h-11",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
      role="group"
      aria-label={isTa ? "எண்ணிக்கை தேர்வி" : "Quantity selector"}
    >
      {/* Decrement Button */}
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
          "min-h-[44px] min-w-[44px] h-11 w-11 flex items-center justify-center rounded-l-xl",
          "text-[#222222] dark:text-[#F0EDE6] hover:bg-black/5 dark:hover:bg-white/10",
          "active:scale-95 focus-visible:ring-2 focus-visible:ring-[#0A6847] focus-visible:outline-none transition-all cursor-pointer",
          (disabled || value <= min) && "opacity-35 cursor-not-allowed active:scale-100"
        )}
        style={{ touchAction: "manipulation" }}
      >
        <Minus className="h-4 w-4 stroke-[2.3]" />
      </button>

      {/* Divider */}
      <span
        aria-hidden="true"
        className="h-5 w-px bg-black/10 dark:bg-white/15 shrink-0"
      />

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
            "w-11 sm:w-12 h-9 text-center font-bold bg-transparent border-0 outline-none tabular-nums font-mono rounded-md",
            "text-[#111111] dark:text-white caret-[#0A6847] dark:caret-emerald-400",
            "[-webkit-text-fill-color:#111111] dark:[-webkit-text-fill-color:#ffffff] opacity-100",
            "focus:ring-1 focus:ring-[#0A6847] dark:focus:ring-emerald-400",
            size === "sm" ? "text-sm" : "text-base"
          )}
          style={{
            touchAction: "manipulation",
            fontVariantNumeric: "tabular-nums",
          }}
        />
      </div>

      {/* Divider */}
      <span
        aria-hidden="true"
        className="h-5 w-px bg-black/10 dark:bg-white/15 shrink-0"
      />

      {/* Increment Button */}
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
          "min-h-[44px] min-w-[44px] h-11 w-11 flex items-center justify-center rounded-r-xl",
          "text-[#222222] dark:text-[#F0EDE6] hover:bg-black/5 dark:hover:bg-white/10",
          "active:scale-95 focus-visible:ring-2 focus-visible:ring-[#0A6847] focus-visible:outline-none transition-all cursor-pointer",
          (disabled || value >= max) && "opacity-35 cursor-not-allowed active:scale-100"
        )}
        style={{ touchAction: "manipulation" }}
      >
        <Plus className="h-4 w-4 stroke-[2.3]" />
      </button>
    </div>
  );
}
