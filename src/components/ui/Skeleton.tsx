import * as React from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular" | "card";
  lines?: number;
}

export function Skeleton({
  className,
  variant = "rectangular",
  lines = 1,
  ...props
}: SkeletonProps) {
  if (variant === "text" && lines > 1) {
    return (
      <div className="space-y-2 w-full" aria-busy="true" aria-live="polite">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-4 rounded-md animate-shimmer bg-[var(--color-surface-subtle)]",
              i === lines - 1 ? "w-3/4" : "w-full",
              className
            )}
            {...props}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className={cn(
        "animate-shimmer bg-[var(--color-surface-subtle)]",
        variant === "text" && "h-4 w-full rounded-md",
        variant === "circular" && "rounded-full",
        variant === "rectangular" && "rounded-xl",
        variant === "card" && "rounded-2xl h-64 w-full border border-[var(--color-border-hairline)]",
        className
      )}
      {...props}
    />
  );
}

