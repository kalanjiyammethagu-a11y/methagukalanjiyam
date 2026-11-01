import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "glass" | "danger";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  href?: string;
  external?: boolean;
}

export function getButtonClassName(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string
) {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 active:scale-[0.98] motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 select-none cursor-pointer";

  const variants: Record<ButtonVariant, string> = {
    primary:
      "bg-[#0A6847] hover:bg-[#085438] text-white shadow-sm shadow-[#0A6847]/20 focus-visible:ring-[#0A6847]",
    secondary:
      "bg-[#F5F3EF] hover:bg-[#EDE9E1] text-[#111111] focus-visible:ring-[#555555]",
    outline:
      "border border-black/15 hover:border-black/30 hover:bg-black/5 text-[#111111] focus-visible:ring-black",
    ghost:
      "hover:bg-black/5 text-[#111111] focus-visible:ring-black",
    glass:
      "glass-panel hover:bg-white/90 text-[#111111] border-white/60 shadow-sm focus-visible:ring-[#0A6847]",
    danger:
      "bg-rose-600 hover:bg-rose-700 text-white shadow-sm focus-visible:ring-rose-500",
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
            {children}
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
          {children}
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
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
