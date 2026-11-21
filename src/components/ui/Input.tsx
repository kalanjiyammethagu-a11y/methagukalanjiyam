import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      id,
      required,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const describedBy = [
      error ? errorId : null,
      helperText && !error ? helperId : null,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-[var(--color-ink-primary)] font-tamil tracking-wide select-none"
          >
            {label}
            {required && (
              <span className="text-rose-600 ml-1 font-bold" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-[var(--color-ink-muted)]">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            type={type}
            ref={ref}
            required={required}
            disabled={disabled}
            aria-required={required}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy || undefined}
            className={cn(
              "w-full min-h-[44px] h-11 rounded-xl text-base sm:text-sm transition-all duration-150",
              "bg-[var(--color-surface-card)] text-[var(--color-ink-primary)]",
              "border border-[var(--color-border-subtle)] placeholder:text-[var(--color-ink-muted)]",
              "hover:border-[var(--color-border-strong)]",
              "focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20",
              "disabled:opacity-50 disabled:bg-[var(--color-surface-subtle)] disabled:cursor-not-allowed",
              leftIcon ? "pl-11 pr-3.5" : "px-3.5",
              rightIcon ? "pr-11" : "",
              error &&
                "border-rose-500 hover:border-rose-600 focus:border-rose-600 focus:ring-rose-500/20",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 flex items-center pointer-events-none text-[var(--color-ink-muted)]">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p
            id={errorId}
            role="alert"
            className="text-xs font-medium text-rose-600 mt-1 font-tamil flex items-center gap-1"
          >
            <span aria-hidden="true">•</span>
            <span>{error}</span>
          </p>
        )}
        {helperText && !error && (
          <p
            id={helperId}
            className="text-xs text-[var(--color-ink-muted)] mt-1 font-tamil"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
