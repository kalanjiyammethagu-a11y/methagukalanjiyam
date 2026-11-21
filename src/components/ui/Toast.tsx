"use client";

import * as React from "react";
import Link from "next/link";
import { X, CheckCircle2, ArrowRight, AlertCircle, ShoppingBag } from "lucide-react";
import { BookmarkRibbonIcon } from "@/components/ui/Icons";
import { cn } from "@/lib/utils";

export interface ToastData {
  id: string;
  titleTa: string;
  titleEn: string;
  messageTa: string;
  messageEn: string;
  actionLabelTa?: string;
  actionLabelEn?: string;
  actionHref?: string;
  onAction?: () => void;
  type?: "wishlist" | "success" | "info" | "cart" | "error";
}

interface ToastProps {
  toast: ToastData | null;
  onClose: () => void;
  locale: "ta" | "en";
}

export function Toast({ toast, onClose, locale }: ToastProps) {
  if (!toast) return null;

  const isTa = locale === "ta";
  const title = isTa ? toast.titleTa : toast.titleEn;
  const message = isTa ? toast.messageTa : toast.messageEn;
  const actionLabel = isTa ? toast.actionLabelTa : toast.actionLabelEn;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 sm:bottom-6 inset-x-4 sm:inset-x-auto sm:right-6 z-[var(--z-toast)] flex justify-center sm:justify-end pointer-events-none animate-in fade-in slide-in-from-bottom-5 duration-200"
    >
      <div className="w-full sm:max-w-md pointer-events-auto bg-[var(--color-surface-card)]/95 backdrop-blur-2xl border border-[var(--color-border-subtle)] rounded-2xl p-4 shadow-2xl flex items-start gap-3.5 text-[var(--color-ink-primary)] transition-all">
        {/* Leading Icon Badge */}
        <div className="h-10 w-10 rounded-xl bg-[var(--color-accent-light)] text-[var(--color-accent)] flex items-center justify-center shrink-0 mt-0.5">
          {toast.type === "wishlist" ? (
            <BookmarkRibbonIcon className="h-5 w-5 text-[var(--color-accent)]" />
          ) : toast.type === "cart" ? (
            <ShoppingBag className="h-5 w-5 text-[var(--color-accent)]" />
          ) : toast.type === "error" ? (
            <AlertCircle className="h-5 w-5 text-rose-600" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-[var(--color-accent)]" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1 text-left">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs sm:text-sm font-bold text-[var(--color-ink-primary)] font-tamil truncate">
              {title}
            </h4>
            <button
              type="button"
              onClick={onClose}
              aria-label={isTa ? "மூடுக" : "Close notification"}
              className="h-9 w-9 min-h-[44px] min-w-[44px] rounded-full hover:bg-[var(--color-surface-subtle)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink-primary)] flex items-center justify-center transition-colors cursor-pointer shrink-0 -mr-2 -mt-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="text-xs text-[var(--color-ink-secondary)] font-tamil leading-relaxed line-clamp-2">
            {message}
          </p>

          {/* Action Link / Button */}
          {actionLabel && (
            <div className="pt-1.5">
              {toast.actionHref ? (
                <Link
                  href={toast.actionHref}
                  onClick={onClose}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-accent)] hover:underline font-tamil min-h-[36px]"
                >
                  <span>{actionLabel}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ) : toast.onAction ? (
                <button
                  type="button"
                  onClick={() => {
                    toast.onAction?.();
                    onClose();
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-accent)] hover:underline font-tamil min-h-[36px] cursor-pointer"
                >
                  <span>{actionLabel}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
