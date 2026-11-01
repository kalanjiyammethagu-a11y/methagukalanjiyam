"use client";

import * as React from "react";
import Link from "next/link";
import { X, CheckCircle2, ArrowRight } from "lucide-react";
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
  type?: "wishlist" | "success" | "info";
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
      className="fixed bottom-5 inset-x-4 sm:inset-x-auto sm:right-6 sm:bottom-6 z-50 flex justify-center sm:justify-end pointer-events-none animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="w-full sm:max-w-md pointer-events-auto bg-white/95 backdrop-blur-2xl border border-black/[0.08] rounded-2xl p-4 shadow-2xl shadow-black/10 flex items-start gap-3.5 text-zinc-900 transition-all">
        {/* Leading Icon Badge */}
        <div className="h-10 w-10 rounded-xl bg-[#0A6847]/10 text-[#0A6847] flex items-center justify-center shrink-0 mt-0.5">
          {toast.type === "wishlist" ? (
            <BookmarkRibbonIcon className="h-5 w-5 text-[#0A6847]" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-[#0A6847]" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs sm:text-sm font-bold text-[#111111] font-tamil truncate">
              {title}
            </h4>
            <button
              type="button"
              onClick={onClose}
              aria-label={isTa ? "மூடுக" : "Close notification"}
              className="h-6 w-6 rounded-full hover:bg-black/5 text-[#777777] hover:text-[#111111] flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <p className="text-xs text-[#555555] font-tamil leading-relaxed line-clamp-2">
            {message}
          </p>

          {/* Action Link */}
          {toast.actionHref && actionLabel && (
            <div className="pt-1.5">
              <Link
                href={toast.actionHref}
                onClick={onClose}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0A6847] hover:text-[#085237] hover:underline font-tamil min-h-[32px]"
              >
                <span>{actionLabel}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
