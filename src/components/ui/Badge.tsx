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
    | "neutral";
}

export function Badge({
  className,
  variant = "neutral",
  children,
  ...props
}: BadgeProps) {
  const baseStyles =
    "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide transition-colors";

  const variants = {
    in_stock:
      "bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50",
    sold_out:
      "bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/50",
    category:
      "bg-[#F5F3EF] text-[#333333] border border-black/5 hover:border-black/15",
    pending:
      "bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/50",
    dispatched:
      "bg-sky-50 text-sky-700 border border-sky-200/60 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800/50",
    delivered:
      "bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50",
    cancelled:
      "bg-zinc-100 text-zinc-600 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400",
    gold:
      "bg-amber-100/70 text-[#8B6508] border border-amber-300/50",
    neutral:
      "bg-black/5 text-[#444444] border border-black/5",
  };

  return (
    <div className={cn(baseStyles, variants[variant], className)} {...props}>
      {children}
    </div>
  );
}
