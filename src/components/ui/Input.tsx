import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", label, error, id, required, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-[#444444] uppercase tracking-wider"
          >
            {label}
            {required && <span className="text-rose-600 ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <div className="relative">
          <input
            id={inputId}
            type={type}
            ref={ref}
            required={required}
            aria-required={required}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            className={cn(
              "w-full min-h-[44px] h-11 px-3.5 rounded-xl text-sm text-[#111111]",
              "bg-white/90 backdrop-blur-md border border-black/12",
              "placeholder:text-[#6E6E6E]",
              "transition-all duration-200",
              "focus:outline-none focus:bg-white focus:border-[#0A6847] focus:ring-2 focus:ring-[#0A6847]/20",
              "disabled:opacity-50 disabled:bg-black/5 disabled:cursor-not-allowed",
              error && "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20",
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p id={errorId} role="alert" className="text-xs font-medium text-rose-600 mt-1">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
