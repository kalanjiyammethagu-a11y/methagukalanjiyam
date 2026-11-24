import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "glass"
  | "danger"
  | "accent";

export type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
  href?: string;
  external?: boolean;
}

export function getButtonClassName(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string
) {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 active:scale-[0.98] motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 select-none cursor-pointer text-center";

  const variants: Record<ButtonVariant, string> = {
    primary:
      "bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-accent-fg,#ffffff)] font-bold shadow-sm focus-visible:ring-[var(--color-accent)]",
    secondary:
      "bg-[var(--color-surface-subtle)] hover:bg-[var(--color-border-hairline)] text-[var(--color-ink-primary)] border border-[var(--color-border-hairline)] focus-visible:ring-[var(--color-ink-muted)]",
    outline:
      "border border-[var(--color-border-strong)] hover:border-[var(--color-accent)] hover:bg-[var(--color-surface-subtle)] text-[var(--color-ink-primary)] focus-visible:ring-[var(--color-accent)]",
    ghost:
      "hover:bg-[var(--color-surface-subtle)] text-[var(--color-ink-primary)] focus-visible:ring-[var(--color-accent)]",
    glass:
      "bg-[var(--color-surface-card)] hover:bg-[var(--color-surface-subtle)] text-[var(--color-ink-primary)] border border-[var(--color-border-subtle)] shadow-xs focus-visible:ring-[var(--color-accent)]",
    danger:
      "bg-rose-600 hover:bg-rose-700 text-white shadow-sm focus-visible:ring-rose-500",
    accent:
      "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm focus-visible:ring-emerald-500",
  };

  const sizes: Record<ButtonSize, string> = {
    sm: "min-h-[44px] sm:min-h-[36px] h-9 px-3 text-xs gap-1.5",
    md: "min-h-[44px] h-11 sm:h-10 px-4 text-sm gap-2",
    lg: "min-h-[48px] h-12 px-6 text-base gap-2.5",
    icon: "min-h-[44px] min-w-[44px] h-11 w-11 sm:h-10 sm:w-10 p-0",
  };

  return cn(baseStyles, variants[variant], sizes[size], className);
}

export const Button = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      loadingText,
      disabled,
      href,
      external,
      children,
      ...props
    },
    ref
  ) => {
    const combinedClassName = getButtonClassName(variant, size, className);

    if (href) {
      if (external) {
        return (
          <a
            ref={ref as React.Ref<HTMLAnchorElement>}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={combinedClassName}
            aria-disabled={disabled || isLoading}
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-current shrink-0" />}
            {isLoading && loadingText ? loadingText : children}
          </a>
        );
      }
      return (
        <Link
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={combinedClassName}
          aria-disabled={disabled || isLoading}
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-current shrink-0" />}
          {isLoading && loadingText ? loadingText : children}
        </Link>
      );
    }

    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        disabled={disabled || isLoading}
        className={combinedClassName}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-current shrink-0" />}
        {isLoading && loadingText ? loadingText : children}
      </button>
    );
  }
);

Button.displayName = "Button";
