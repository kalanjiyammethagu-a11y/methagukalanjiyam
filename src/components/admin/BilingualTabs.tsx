"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppLocale, LanguageCompleteness } from "@/lib/i18n";

interface BilingualTabsProps {
  activeTab: AppLocale;
  onTabChange: (nextTab: AppLocale) => void;
  completeness: LanguageCompleteness;
  /** True when the active tab has unsaved edits since modal opened or last saved */
  isActiveTabDirty?: boolean;
  className?: string;
}

export function BilingualTabs({
  activeTab,
  onTabChange,
  completeness,
  isActiveTabDirty = false,
  className,
}: BilingualTabsProps) {
  const [pendingTab, setPendingTab] = React.useState<AppLocale | null>(null);

  React.useEffect(() => {
    setPendingTab(null);
  }, [activeTab]);

  const handleClickTab = (target: AppLocale) => {
    if (target === activeTab) return;
    if (isActiveTabDirty) {
      setPendingTab(target);
      return;
    }
    onTabChange(target);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div
        role="tablist"
        aria-label="Content language editor tabs"
        className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-gray-100 border border-gray-200"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "en"}
          onClick={() => handleClickTab("en")}
          className={cn(
            "flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all min-h-[44px] cursor-pointer",
            activeTab === "en"
              ? "bg-white text-gray-900 shadow-xs ring-1 ring-black/5"
              : "text-gray-600 hover:text-gray-900"
          )}
        >
          <span>English (Required)</span>
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold leading-normal",
              completeness.enComplete
                ? "bg-emerald-50 text-[#0A6847] border border-emerald-200"
                : "bg-rose-50 text-rose-700 border border-rose-200"
            )}
          >
            {completeness.enComplete ? "Complete" : "Missing"}
          </span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "ta"}
          onClick={() => handleClickTab("ta")}
          className={cn(
            "flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold font-tamil transition-all min-h-[44px] cursor-pointer leading-[1.45]",
            activeTab === "ta"
              ? "bg-white text-gray-900 shadow-xs ring-1 ring-black/5"
              : "text-gray-600 hover:text-gray-900"
          )}
        >
          <span>தமிழ் (Tamil)</span>
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold leading-normal",
              completeness.taComplete
                ? "bg-emerald-50 text-[#0A6847] border border-emerald-200"
                : "bg-amber-50 text-amber-800 border border-amber-200"
            )}
          >
            {completeness.taComplete ? "Complete" : "Missing Tamil"}
          </span>
        </button>
      </div>

      {/* Unsaved-change warning before switching tabs */}
      {pendingTab && (
        <div
          role="alert"
          className="rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-950"
        >
          <div className="flex items-start sm:items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5 sm:mt-0" />
            <span>
              You have unsaved edits in the{" "}
              <strong>{activeTab === "en" ? "English" : "தமிழ் (Tamil)"}</strong> tab. Draft changes
              stay in the form until you click Save.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setPendingTab(null)}
              className="px-2.5 py-1.5 rounded-lg border border-amber-300 bg-white text-[11px] font-bold text-amber-950 hover:bg-amber-100 cursor-pointer"
            >
              Stay
            </button>
            <button
              type="button"
              onClick={() => {
                const next = pendingTab;
                setPendingTab(null);
                onTabChange(next);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-amber-800 text-white text-[11px] font-bold hover:bg-amber-900 cursor-pointer"
            >
              Switch to {pendingTab === "en" ? "English" : "தமிழ்"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function BilingualListBadge({
  completeness,
}: {
  completeness: LanguageCompleteness;
}) {
  if (completeness.missingEnglish) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-bold leading-normal whitespace-nowrap">
        <AlertTriangle className="h-2.5 w-2.5 shrink-0" />
        Missing EN
      </span>
    );
  }
  if (completeness.missingTamil) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold leading-normal whitespace-nowrap">
        <AlertTriangle className="h-2.5 w-2.5 shrink-0" />
        Missing Tamil
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-[#0A6847] border border-emerald-200 text-[10px] font-bold leading-normal whitespace-nowrap font-tamil">
      <CheckCircle2 className="h-2.5 w-2.5 shrink-0" />
      EN + தமிழ்
    </span>
  );
}
