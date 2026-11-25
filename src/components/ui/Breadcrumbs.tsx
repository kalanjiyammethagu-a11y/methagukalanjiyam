"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  labelEn?: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  locale?: "ta" | "en";
  className?: string;
}

export function Breadcrumbs({ items, locale = "ta", className }: BreadcrumbsProps) {
  return (
    <nav
      aria-label={locale === "ta" ? "பக்க வழிச்செலுத்தல்" : "Breadcrumb navigation"}
      className={cn("py-4", className)}
    >
      <ol
        className="flex items-center gap-1.5 text-xs font-medium text-[#555555] dark:text-zinc-400 flex-wrap"
        itemScope
        itemType="https://schema.org/BreadcrumbList"
      >
        {/* Home */}
        <li
          className="flex items-center gap-1.5"
          itemProp="itemListElement"
          itemScope
          itemType="https://schema.org/ListItem"
        >
          <Link
            href="/"
            className="flex items-center gap-1 hover:text-[#0A6847] dark:hover:text-emerald-400 transition-colors min-h-[32px] px-1"
            itemProp="item"
          >
            <Home className="h-3.5 w-3.5" aria-hidden="true" />
            <span itemProp="name" className="font-tamil">
              {locale === "ta" ? "முகப்பு" : "Home"}
            </span>
          </Link>
          <meta itemProp="position" content="1" />
        </li>

        {items.map((item, index) => (
          <li
            key={index}
            className="flex items-center gap-1.5"
            itemProp="itemListElement"
            itemScope
            itemType="https://schema.org/ListItem"
          >
            <ChevronRight className="h-3 w-3 text-black/45 dark:text-white/45 shrink-0" aria-hidden="true" />
            {item.href ? (
              <Link
                href={item.href}
                className="hover:text-[#0A6847] dark:hover:text-emerald-400 transition-colors min-h-[32px] flex items-center px-1 font-tamil"
                itemProp="item"
              >
                <span itemProp="name">
                  {locale === "ta" ? item.label : (item.labelEn || item.label)}
                </span>
              </Link>
            ) : (
              <span
                className="text-[#111111] dark:text-zinc-100 font-semibold font-tamil px-1"
                itemProp="name"
                aria-current="page"
              >
                {locale === "ta" ? item.label : (item.labelEn || item.label)}
              </span>
            )}
            <meta itemProp="position" content={String(index + 2)} />
          </li>
        ))}
      </ol>
    </nav>
  );
}
