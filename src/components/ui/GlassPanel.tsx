import * as React from "react";
import { cn } from "@/lib/utils";

export interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "light" | "subtle" | "dark";
  interactive?: boolean;
}

export const GlassPanel = React.forwardRef<HTMLDivElement, GlassPanelProps>(
  (
    {
      className,
      variant = "light",
      interactive = false,
      children,
      ...props
    },
    ref
  ) => {
    const variantClasses = {
      light: "glass-panel",
      subtle: "glass-panel-subtle",
      dark: "glass-panel-dark text-white",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl transition-all duration-300",
          variantClasses[variant],
          interactive && "glass-card-hover cursor-pointer",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassPanel.displayName = "GlassPanel";
