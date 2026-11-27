"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calendar, Clock, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { localized } from "@/lib/i18n";
import { resolveBlogCoverUrl } from "@/lib/blog-utils";

export interface ArticleCardData {
  slug: string;
  titleTa: string;
  titleEn: string;
  excerptTa: string;
  excerptEn: string;
  coverImage: string;
  coverAltTa?: string;
  coverAltEn?: string;
  categoryTa: string;
  categoryEn: string;
  publishedAt: string;
  readingTimeMinutes: number;
  featured?: boolean;
}

interface ArticleCardProps {
  article: ArticleCardData;
  locale?: "ta" | "en";
  variant?: "standard" | "compact" | "featured";
  className?: string;
}

export function ArticleCard({
  article,
  locale = "ta",
  variant = "standard",
  className,
}: ArticleCardProps) {
  const isTa = locale === "ta";
  const title = localized(article, "title", locale);
  const excerpt = localized(article, "excerpt", locale);
  const category = localized(article, "category", locale);
  const coverAlt = localized(article, "coverAlt", locale, title);
  const normalizedCoverSrc = resolveBlogCoverUrl(article.coverImage);

  // Format date nicely
  const formattedDate = React.useMemo(() => {
    try {
      const d = new Date(article.publishedAt);
      return d.toLocaleDateString(isTa ? "ta-IN" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return article.publishedAt;
    }
  }, [article.publishedAt, isTa]);

  if (variant === "featured") {
    return (
      <article
        className={cn(
          "group relative glass-panel rounded-3xl overflow-hidden border border-black/10 dark:border-white/10 hover:border-[#0A6847]/40 dark:hover:border-emerald-500/40 transition-all duration-300 hover:shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-0",
          className
        )}
      >
        <div className="lg:col-span-7 relative aspect-[16/10] lg:aspect-auto lg:min-h-[380px] overflow-hidden bg-black/5 dark:bg-white/5">
          <Image
            src={normalizedCoverSrc}
            alt={coverAlt}
            fill
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent lg:hidden" />
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#0A6847] text-white shadow-sm flex items-center gap-1.5 font-tamil">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
              {isTa ? "சிறப்பு ஆவணம்" : "Featured"}
            </span>
            <Badge variant="glass" size="sm" className="font-tamil">
              {category}
            </Badge>
          </div>
        </div>

        <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-xs font-medium text-[#555555] dark:text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-[#0A6847] dark:text-emerald-400" />
                {formattedDate}
              </span>
              <span aria-hidden="true">•</span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-[#0A6847] dark:text-emerald-400" />
                {article.readingTimeMinutes} {isTa ? "நிமிடம்" : "min read"}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-[#111111] dark:text-zinc-100 group-hover:text-[#0A6847] dark:group-hover:text-emerald-400 transition-colors leading-snug font-tamil">
              <Link href={`/blog/${article.slug}`} className="focus:outline-none">
                {title}
              </Link>
            </h2>

            <p className="text-sm text-[#444444] dark:text-zinc-300 leading-relaxed line-clamp-3 font-tamil">
              {excerpt}
            </p>
          </div>

          <div className="pt-6 mt-4 border-t border-black/8 dark:border-white/10 flex items-center justify-between">
            <Link
              href={`/blog/${article.slug}`}
              className="inline-flex items-center gap-2 text-sm font-bold text-[#0A6847] dark:text-emerald-400 hover:text-[#085237] dark:hover:text-emerald-300 group/link min-h-[44px]"
            >
              <span>{isTa ? "முழு ஆவணத்தைப் படிக்க" : "Read Full Article"}</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-1" />
            </Link>

            <span className="text-xs text-[#666666] dark:text-zinc-400 font-tamil hidden sm:inline">
              {isTa ? "வரலாற்றுப் பதிவு" : "Historical Record"}
            </span>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      className={cn(
        "group relative glass-panel rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 hover:border-[#0A6847]/40 dark:hover:border-emerald-500/40 transition-all duration-300 hover:shadow-lg flex flex-col h-full",
        className
      )}
    >
      {/* Cover Image */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-black/5 dark:bg-white/5 shrink-0">
        <Image
          src={normalizedCoverSrc}
          alt={coverAlt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
        <div className="absolute top-3 left-3 z-10">
          <Badge variant="glass" size="sm" className="font-tamil bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md shadow-xs">
            {category}
          </Badge>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex flex-col justify-between flex-1">
        <div className="space-y-2.5">
          {/* Metadata row */}
          <div className="flex items-center gap-3 text-[11px] font-semibold text-[#555555] dark:text-zinc-400">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-[#0A6847] dark:text-emerald-400" />
              {formattedDate}
            </span>
            <span aria-hidden="true">•</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-[#0A6847] dark:text-emerald-400" />
              {article.readingTimeMinutes} {isTa ? "நிமிடம்" : "min read"}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-base sm:text-lg font-bold text-[#111111] dark:text-zinc-100 group-hover:text-[#0A6847] dark:group-hover:text-emerald-400 transition-colors leading-snug line-clamp-2 font-tamil">
            <Link href={`/blog/${article.slug}`} className="focus:outline-none">
              {title}
            </Link>
          </h3>

          {/* Excerpt */}
          <p className="text-xs sm:text-sm text-[#444444] dark:text-zinc-300 leading-relaxed line-clamp-2 font-tamil">
            {excerpt}
          </p>
        </div>

        {/* Read More Link (Fitts's Law 44px touch target) */}
        <div className="pt-4 mt-4 border-t border-black/8 dark:border-white/10 flex items-center justify-between">
          <Link
            href={`/blog/${article.slug}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0A6847] dark:text-emerald-400 group-hover:underline min-h-[44px]"
            aria-label={`${isTa ? "படிக்க" : "Read"}: ${title}`}
          >
            <span>{isTa ? "படிக்க" : "Read Article"}</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
          <BookOpen className="h-4 w-4 text-black/25 dark:text-white/30 group-hover:text-[#0A6847]/60 dark:group-hover:text-emerald-400/70 transition-colors" />
        </div>
      </div>
    </article>
  );
}
