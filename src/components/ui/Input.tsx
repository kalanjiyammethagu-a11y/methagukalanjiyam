import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", label, error, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-[#444444] uppercase tracking-wider"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            id={inputId}
            type={type}
            ref={ref}
            className={cn(
              "w-full h-11 px-3.5 rounded-xl text-sm text-[#111111]",
              "bg-white/80 backdrop-blur-md border border-black/10",
              "placeholder:text-black/35",
              "transition-all duration-200",
              "focus:outline-none focus:bg-white focus:border-[#0A6847] focus:ring-2 focus:ring-[#0A6847]/15",
              "disabled:opacity-50 disabled:bg-black/5 disabled:cursor-not-allowed",
              error && "border-rose-500 focus:border-rose-500 focus:ring-rose-500/15",
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
