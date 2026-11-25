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
 * Touch-optimized Quantity Stepper.
 *
 * Design: always uses a dark pill (#111111 bg, white text) so the number is
 * ALWAYS visible regardless of theme or mode. This matches the screenshot
 * where the bar appears dark — we lean into it and guarantee white text.
 *
 * Rules:
 * - Meets WCAG 2.5.5 minimum 44×44 px touch target
 * - inputMode="numeric" + pattern="[0-9]*" for mobile keyboard
 * - touch-action: manipulation — eliminates 300 ms double-tap delay
 * - WebkitTextFillColor + opacity:1 — overrides iOS Safari dimming
 * - w-full so it fills its flex-col container on mobile (book detail page)
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
        // w-full so it fills flex-col containers on mobile; shrinks to content in flex-row
        "flex items-center rounded-xl select-none w-full",
        size === "sm" ? "h-11" : "h-11",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
      style={{
        // Always dark pill — high contrast guaranteed in all themes/modes
        backgroundColor: "#111111",
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
      }}
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
          "min-h-[44px] min-w-[44px] h-11 flex-1 flex items-center justify-center rounded-l-xl active:scale-95 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none transition-all cursor-pointer",
          (disabled || value <= min) && "opacity-30 cursor-not-allowed active:scale-100"
        )}
        style={{
          touchAction: "manipulation",
          color: "#FFFFFF",
          backgroundColor: "transparent",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor =
            "rgba(255,255,255,0.12)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor =
            "transparent";
        }}
      >
        <Minus className="h-4 w-4 stroke-[2.5]" />
      </button>

      {/* Divider */}
      <div
        style={{
          width: "1px",
          height: "24px",
          backgroundColor: "rgba(255,255,255,0.15)",
          flexShrink: 0,
        }}
      />

      {/* Editable Numeric Input — always white text on dark bg */}
      <div className="relative flex items-center justify-center px-2 flex-1">
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
            "w-full h-9 text-center font-bold bg-transparent border-0 outline-none tabular-nums focus:ring-1 focus:ring-white/40 rounded-md",
            size === "sm" ? "text-sm" : "text-base"
          )}
          style={{
            touchAction: "manipulation",
            fontVariantNumeric: "tabular-nums",
            // Explicit white — works in ALL modes/themes
            color: "#FFFFFF",
            WebkitTextFillColor: "#FFFFFF", // iOS Safari
            caretColor: "#FFFFFF",
            opacity: 1, // prevent iOS disabled dimming
            colorScheme: "dark", // hint browser to render as dark field
          }}
        />
      </div>

      {/* Divider */}
      <div
        style={{
          width: "1px",
          height: "24px",
          backgroundColor: "rgba(255,255,255,0.15)",
          flexShrink: 0,
        }}
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
          "min-h-[44px] min-w-[44px] h-11 flex-1 flex items-center justify-center rounded-r-xl active:scale-95 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none transition-all cursor-pointer",
          (disabled || value >= max) && "opacity-30 cursor-not-allowed active:scale-100"
        )}
        style={{
          touchAction: "manipulation",
          color: "#FFFFFF",
          backgroundColor: "transparent",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor =
            "rgba(255,255,255,0.12)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor =
            "transparent";
        }}
      >
        <Plus className="h-4 w-4 stroke-[2.5]" />
      </button>
    </div>
  );
}
