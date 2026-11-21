import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      options,
      children,
      id,
      required,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const selectId = id || generatedId;
    const errorId = `${selectId}-error`;
    const helperId = `${selectId}-helper`;

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
            htmlFor={selectId}
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
          <select
            id={selectId}
            ref={ref}
            required={required}
            disabled={disabled}
            aria-required={required}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy || undefined}
            className={cn(
              "w-full min-h-[44px] h-11 px-3.5 pr-10 rounded-xl text-base sm:text-sm appearance-none transition-all duration-150 cursor-pointer",
              "bg-[var(--color-surface-card)] text-[var(--color-ink-primary)]",
              "border border-[var(--color-border-subtle)]",
              "hover:border-[var(--color-border-strong)]",
              "focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20",
              "disabled:opacity-50 disabled:bg-[var(--color-surface-subtle)] disabled:cursor-not-allowed",
              error &&
                "border-rose-500 hover:border-rose-600 focus:border-rose-600 focus:ring-rose-500/20",
              className
            )}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option
                    key={opt.value}
                    value={opt.value}
                    disabled={opt.disabled}
                  >
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          <div className="absolute right-3.5 pointer-events-none text-[var(--color-ink-muted)]">
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </div>
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

Select.displayName = "Select";

