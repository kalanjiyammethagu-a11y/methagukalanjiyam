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
    "inline-flex items-center gap-1.5 rounded-full font-semibold tracking-wide transition-colors";

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[11px]",
    md: "px-2.5 py-0.5 text-xs",
    lg: "px-3.5 py-1 text-xs",
  };

  const variants = {
    in_stock:
      "bg-emerald-50 text-emerald-800 border border-emerald-300/70 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60",
    success:
      "bg-emerald-50 text-[#0A6847] border border-emerald-300/70 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60",
    glass:
      "bg-white/80 text-[#111111] border border-black/10 backdrop-blur-md shadow-2xs dark:bg-zinc-800/80 dark:text-zinc-200 dark:border-zinc-700",
    sold_out:
      "bg-rose-50 text-rose-800 border border-rose-300/70 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/60",
    category:
      "bg-[#F5F3EF] text-[#222222] border border-black/8 hover:border-black/20 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700",
    pending:
      "bg-amber-50 text-amber-900 border border-amber-300/70 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60",
    dispatched:
      "bg-sky-50 text-sky-900 border border-sky-300/70 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800/60",
    delivered:
      "bg-emerald-50 text-emerald-800 border border-emerald-300/70 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60",
    cancelled:
      "bg-zinc-100 text-zinc-700 border border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
    gold:
      "bg-amber-50 text-[#7D5300] border border-amber-300/80 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-700/60",
    neutral:
      "bg-black/6 text-[#222222] border border-black/8 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700",
  };

  return (
    <div className={cn(baseStyles, sizeStyles[size], variants[variant], className)} {...props}>
      {children}
    </div>
  );
}
