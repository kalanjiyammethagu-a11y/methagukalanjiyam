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
 * - Uses data-dark attribute + inline style to bypass Tailwind dark: specificity issues
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
  const [isDark, setIsDark] = React.useState(false);

  // Detect dark/night mode at runtime — bypasses Tailwind specificity entirely
  React.useEffect(() => {
    const checkDark = () => {
      const html = document.documentElement;
      setIsDark(
        html.classList.contains("dark") ||
          html.getAttribute("data-theme") === "night"
      );
    };
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });
    return () => observer.disconnect();
  }, []);

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

  // Runtime-computed colors — always correct regardless of CSS specificity
  const iconColor = isDark ? "#F0EDE6" : "#333333";
  const inputTextColor = isDark ? "#FFFFFF" : "#111111";
  const bgColor = isDark ? "#1a1918" : "#FFFFFF";
  const borderColor = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)";
  const hoverBg = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)";

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-xl shadow-2xs select-none",
        size === "sm" ? "h-11" : "h-11",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
      style={{
        backgroundColor: bgColor,
        border: `1px solid ${borderColor}`,
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
          "min-h-[44px] min-w-[44px] h-11 w-11 flex items-center justify-center rounded-l-xl active:scale-95 focus-visible:ring-2 focus-visible:ring-[#0A6847] focus-visible:outline-none transition-all cursor-pointer",
          (disabled || value <= min) && "opacity-30 cursor-not-allowed active:scale-100"
        )}
        style={{ touchAction: "manipulation", color: iconColor }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = hoverBg; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
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
            "w-10 sm:w-12 h-9 text-center font-bold bg-transparent border-0 outline-none tabular-nums font-mono focus:ring-1 focus:ring-[#0A6847] rounded-md",
            size === "sm" ? "text-sm" : "text-base"
          )}
          style={{
            touchAction: "manipulation",
            fontVariantNumeric: "tabular-nums",
            color: inputTextColor,
            WebkitTextFillColor: inputTextColor, // iOS Safari override
            opacity: 1,                          // prevent iOS dimming
          }}
        />
      </div>

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
          "min-h-[44px] min-w-[44px] h-11 w-11 flex items-center justify-center rounded-r-xl active:scale-95 focus-visible:ring-2 focus-visible:ring-[#0A6847] focus-visible:outline-none transition-all cursor-pointer",
          (disabled || value >= max) && "opacity-30 cursor-not-allowed active:scale-100"
        )}
        style={{ touchAction: "manipulation", color: iconColor }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = hoverBg; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
      >
        <Plus className="h-4 w-4 stroke-[2.2]" />
      </button>
    </div>
  );
}
