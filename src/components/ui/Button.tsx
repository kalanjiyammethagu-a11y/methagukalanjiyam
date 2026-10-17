import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "glass" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 select-none cursor-pointer";

    const variants = {
      primary:
        "bg-[#0A6847] hover:bg-[#085438] text-white shadow-sm shadow-[#0A6847]/20 focus-visible:ring-[#0A6847]",
      secondary:
        "bg-[#F5F3EF] hover:bg-[#EDE9E1] text-[#111111] focus-visible:ring-[#666666]",
      outline:
        "border border-black/15 hover:border-black/30 hover:bg-black/5 text-[#111111] focus-visible:ring-black",
      ghost:
        "hover:bg-black/5 text-[#111111] focus-visible:ring-black",
      glass:
        "glass-panel hover:bg-white/85 text-[#111111] border-white/60 shadow-sm focus-visible:ring-[#0A6847]",
      danger:
        "bg-rose-600 hover:bg-rose-700 text-white shadow-sm focus-visible:ring-rose-500",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs gap-1.5",
      md: "h-10 px-4 text-sm gap-2",
      lg: "h-12 px-6 text-base gap-2.5",
      icon: "h-10 w-10 p-0",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-current" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
