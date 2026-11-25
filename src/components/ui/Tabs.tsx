"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
  variant?: "pills" | "underline" | "segmented";
  size?: "sm" | "md" | "lg";
  ariaLabel?: string;
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  className,
  variant = "segmented",
  size = "md",
  ariaLabel = "Navigation tabs",
}: TabsProps) {
  const tabListRef = React.useRef<HTMLDivElement>(null);

  // Keyboard navigation for composite tablist (WAI-ARIA APG pattern)
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let targetIndex = -1;

    if (e.key === "ArrowRight") {
      e.preventDefault();
      targetIndex = (index + 1) % tabs.length;
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      targetIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (e.key === "Home") {
      e.preventDefault();
      targetIndex = 0;
    } else if (e.key === "End") {
      e.preventDefault();
      targetIndex = tabs.length - 1;
    }

    if (targetIndex >= 0 && !tabs[targetIndex].disabled) {
      onChange(tabs[targetIndex].id);
      const buttons = tabListRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
      buttons?.[targetIndex]?.focus();
    }
  };

  const sizeStyles = {
    sm: "min-h-[36px] py-1 px-3 text-xs",
    md: "min-h-[44px] py-2 px-4 text-xs sm:text-sm",
    lg: "min-h-[48px] py-2.5 px-5 text-sm sm:text-base",
  };

  return (
    <div
      ref={tabListRef}
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "flex items-center gap-1 overflow-x-auto scrollbar-none",
        variant === "segmented" &&
          "p-1 rounded-2xl bg-[var(--color-surface-subtle)] border border-[var(--color-border-hairline)]",
        variant === "underline" &&
          "border-b border-[var(--color-border-hairline)] gap-2",
        variant === "pills" && "gap-2",
        className
      )}
    >
      {tabs.map((tab, idx) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            id={`tab-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            disabled={tab.disabled}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={cn(
              "font-medium rounded-xl transition-all font-tamil flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer select-none active:scale-[0.98]",
              sizeStyles[size],
              variant === "segmented" && [
                isActive
                  ? "bg-[var(--color-surface-card)] text-[var(--color-accent)] font-bold shadow-xs border border-[var(--color-border-subtle)]"
                  : "text-[var(--color-ink-secondary)] hover:text-[var(--color-ink-primary)] hover:bg-[var(--color-surface-card)]/50",
              ],
              variant === "underline" && [
                "rounded-none border-b-2 -mb-px px-3",
                isActive
                  ? "border-[var(--color-accent)] text-[var(--color-accent)] font-bold"
                  : "border-transparent text-[var(--color-ink-secondary)] hover:text-[var(--color-ink-primary)] hover:border-[var(--color-border-strong)]",
              ],
              variant === "pills" && [
                "rounded-full border",
                isActive
                  ? "bg-[var(--color-accent)] text-[var(--color-accent-fg)] border-[var(--color-accent)] font-bold shadow-xs"
                  : "bg-[var(--color-surface-card)] text-[var(--color-ink-secondary)] border-[var(--color-border-subtle)] hover:border-[var(--color-accent)] hover:text-[var(--color-ink-primary)]",
              ],
              tab.disabled && "opacity-40 cursor-not-allowed pointer-events-none"
            )}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge && <span className="shrink-0">{tab.badge}</span>}
          </button>
        );
      })}
    </div>
  );
}

