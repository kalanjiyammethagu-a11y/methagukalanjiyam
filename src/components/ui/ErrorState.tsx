"use client";

import * as React from "react";
import { AlertCircle, RefreshCw, Home, ArrowLeft } from "lucide-react";
import { Button } from "./Button";
import { cn } from "@/lib/utils";

export interface ErrorStateProps {
  title?: string;
  titleTa?: string;
  description?: string;
  descriptionTa?: string;
  error?: (Error & { digest?: string }) | { message: string; digest?: string };
  onRetry?: () => void;
  showHomeButton?: boolean;
  locale?: "ta" | "en";
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  titleTa = "எதிர்பாராத பிழை ஏற்பட்டது",
  description = "An error occurred while loading this section. Please try again.",
  descriptionTa = "இப்பகுதியை ஏற்றுவதில் பிழை ஏற்பட்டது. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.",
  error,
  onRetry,
  showHomeButton = true,
  locale = "ta",
  className,
}: ErrorStateProps) {
  const [showDetails, setShowDetails] = React.useState(false);
  const isTa = locale === "ta";

  return (
    <div
      role="alert"
      className={cn(
        "rounded-3xl p-6 sm:p-10 text-center flex flex-col items-center justify-center max-w-lg mx-auto",
        "bg-[var(--color-surface-card)] border border-rose-200 dark:border-rose-900/40 shadow-sm",
        className
      )}
    >
      <div className="h-14 w-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 mb-4 shadow-2xs">
        <AlertCircle className="h-7 w-7" aria-hidden="true" />
      </div>

      <h2 className="text-lg sm:text-xl font-bold font-tamil text-[var(--color-ink-primary)]">
        {isTa ? titleTa : title}
      </h2>

      <p className="text-xs sm:text-sm font-tamil text-[var(--color-ink-secondary)] mt-2 max-w-md leading-relaxed">
        {isTa ? descriptionTa : description}
      </p>

      {error?.digest && (
        <p className="mt-2 text-[11px] font-mono text-[var(--color-ink-muted)] bg-[var(--color-surface-subtle)] px-2.5 py-1 rounded-md">
          Digest: {error.digest}
        </p>
      )}

      {error?.message && (
        <div className="mt-3 w-full">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="text-[11px] text-[var(--color-ink-muted)] hover:underline cursor-pointer"
          >
            {showDetails
              ? isTa ? "பிழை விபரங்களை மறை" : "Hide details"
              : isTa ? "தொழில்நுட்ப விபரங்களைக் காண்க" : "View technical details"}
          </button>
          {showDetails && (
            <pre className="mt-2 p-3 rounded-xl bg-[var(--color-surface-subtle)] text-[var(--color-ink-muted)] text-[11px] font-mono text-left overflow-x-auto max-h-32">
              {error.message}
            </pre>
          )}
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <Button
            variant="primary"
            size="md"
            onClick={onRetry}
            className="gap-2 font-tamil"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            <span>{isTa ? "மீண்டும் முயற்சி செய்" : "Try Again"}</span>
          </Button>
        )}
        {showHomeButton && (
          <Button
            variant="secondary"
            size="md"
            href="/"
            className="gap-2 font-tamil"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            <span>{isTa ? "முகப்பிற்குச் செல்" : "Go to Home"}</span>
          </Button>
        )}
      </div>
    </div>
  );
}
