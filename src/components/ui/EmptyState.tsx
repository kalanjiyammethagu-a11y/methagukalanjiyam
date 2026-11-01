"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

interface EmptyStateProps {
  icon: React.ReactNode | React.ComponentType<{ className?: string }>;
  titleTa: string;
  titleEn: string;
  descriptionTa?: string;
  descriptionEn?: string;
  actionLabelTa?: string;
  actionLabelEn?: string;
  actionHref?: string;
  onAction?: () => void;
  locale?: "ta" | "en";
  className?: string;
}

export function EmptyState({
  icon,
  titleTa,
  titleEn,
  descriptionTa,
  descriptionEn,
  actionLabelTa,
  actionLabelEn,
  actionHref,
  onAction,
  locale = "ta",
  className,
}: EmptyStateProps) {
  const renderedIcon = React.isValidElement(icon)
    ? icon
    : typeof icon === "function" || typeof icon === "object"
    ? React.createElement(icon as React.ComponentType<{ className?: string }>, { className: "h-10 w-10" })
    : icon;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-16 sm:py-24 px-6",
        className
      )}
    >
      {/* Icon */}
      <div className="h-20 w-20 rounded-3xl bg-[#F5F3EF] flex items-center justify-center text-[#555555] mb-6">
        {renderedIcon}
      </div>

      {/* Title */}
      <h3 className="text-lg sm:text-xl font-bold text-[#111111] font-tamil mb-2">
        {locale === "ta" ? titleTa : titleEn}
      </h3>

      {/* Description */}
      {(descriptionTa || descriptionEn) && (
        <p className="text-sm text-[#555555] font-medium max-w-sm font-tamil mb-8 leading-relaxed">
          {locale === "ta" ? (descriptionTa || descriptionEn) : (descriptionEn || descriptionTa)}
        </p>
      )}

      {/* CTA */}
      {(actionLabelTa || actionLabelEn) && (
        actionHref ? (
          <Button href={actionHref} variant="primary" size="md">
            <span className="font-tamil">
              {locale === "ta" ? (actionLabelTa || actionLabelEn) : (actionLabelEn || actionLabelTa)}
            </span>
          </Button>
        ) : onAction ? (
          <Button variant="primary" size="md" onClick={onAction}>
            <span className="font-tamil">
              {locale === "ta" ? (actionLabelTa || actionLabelEn) : (actionLabelEn || actionLabelTa)}
            </span>
          </Button>
        ) : null
      )}
    </div>
  );
}
