import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | "in_stock"
    | "sold_out"
    | "category"
    | "pending"
    | "dispatched"
    | "delivered"
    | "cancelled"
    | "gold"
    | "neutral"
    | "success"
    | "glass";
  size?: "sm" | "md" | "lg";
}

export function Badge({
  className,
  variant = "neutral",
  size = "md",
  children,
  ...props
}: BadgeProps) {
  const baseStyles =
    "inline-flex items-center gap-1.5 rounded-full font-semibold tracking-wide transition-colors font-tamil select-none";

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[11px]",
    md: "px-2.5 py-0.5 text-xs",
    lg: "px-3.5 py-1 text-xs sm:text-sm",
  };

  const variants = {
    in_stock:
      "bg-emerald-50 text-emerald-800 border border-emerald-300/70 dark:bg-emerald-950/90 dark:text-emerald-300 dark:border-emerald-700/70",
    success:
      "bg-emerald-50 text-[#0A6847] border border-emerald-300/70 dark:bg-emerald-950/90 dark:text-emerald-300 dark:border-emerald-700/70",
    glass:
      "bg-[var(--color-surface-card)] text-[var(--color-ink-primary)] border border-[var(--color-border-subtle)] shadow-2xs",
    sold_out:
      "bg-rose-50 text-rose-800 border border-rose-300/70 dark:bg-rose-950/90 dark:text-rose-300 dark:border-rose-700/70",
    category:
      "bg-[var(--color-surface-subtle)] text-[var(--color-ink-primary)] border border-[var(--color-border-hairline)] hover:border-[var(--color-accent)]",
    pending:
      "bg-amber-50 text-amber-900 border border-amber-300/70 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700/70",
    dispatched:
      "bg-sky-50 text-sky-900 border border-sky-300/70 dark:bg-sky-950/90 dark:text-sky-200 dark:border-sky-700/70",
    delivered:
      "bg-emerald-50 text-emerald-800 border border-emerald-300/70 dark:bg-emerald-950/90 dark:text-emerald-300 dark:border-emerald-700/70",
    cancelled:
      "bg-[var(--color-surface-subtle)] text-[var(--color-ink-muted)] border border-[var(--color-border-hairline)]",
    gold:
      "bg-amber-50 text-amber-900 border border-amber-300/80 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700/70",
    neutral:
      "bg-[var(--color-surface-subtle)] text-[var(--color-ink-primary)] border border-[var(--color-border-hairline)]",
  };

  return (
    <div className={cn(baseStyles, sizeStyles[size], variants[variant], className)} {...props}>
      {children}
    </div>
  );
}
