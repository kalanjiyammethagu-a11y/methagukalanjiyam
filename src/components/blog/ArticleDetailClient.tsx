"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Share2,
  Check,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { useLanguage } from "@/context/LanguageContext";
import { getBookBySlug, type BookItem } from "@/data/books";
import { formatINR } from "@/lib/utils";
import { formatArticleBodyHtml } from "@/lib/blog-utils";
import type { ArticleDetailData } from "@/data/articles";
import { localized } from "@/lib/i18n";

interface ArticleDetailClientProps {
  article: ArticleDetailData;
}

export function ArticleDetailClient({ article }: ArticleDetailClientProps) {
  const { locale } = useLanguage();
  const isTa = locale === "ta";

  const [copied, setCopied] = React.useState(false);
  const [scrollProgress, setScrollProgress] = React.useState(0);

  // Read progress bar (Zeigarnik Effect)
  React.useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const currentProgress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(Math.min(100, Math.max(0, currentProgress)));
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleShare = async () => {
    if (typeof window !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: isTa ? article.titleTa : article.titleEn,
          url: window.location.href,
        });
      } catch {
        // user cancelled or share failed
      }
    } else if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const title = localized(article, "title", locale);
  const subtitle = localized(article, "subtitle", locale);
  const author = localized(article, "author", locale);
  const category = localized(article, "category", locale);
  const content = localized(article, "htmlContent", locale);
  const coverAlt = localized(article, "coverAlt", locale, title);
  const normalizedCoverSrc =
    article.coverImage.startsWith("http") || article.coverImage.startsWith("/")
      ? article.coverImage
      : `/${article.coverImage}`;

  return (
    <div className="min-h-screen pb-24">
      {/* Top Reading Progress Bar (Zeigarnik Effect) */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-black/5 z-50">
        <div
          className="h-full bg-gradient-to-r from-[#0A6847] to-emerald-400 transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Breadcrumbs Navigation */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <Breadcrumbs
          items={[
            { label: isTa ? "களஞ்சியப் பதிவுகள்" : "Articles", href: "/blog" },
            { label: title },
          ]}
        />
      </div>

      <article className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Back Link */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#555555] dark:text-zinc-300 hover:text-[#0A6847] dark:hover:text-emerald-400 transition-colors min-h-[44px]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{isTa ? "பதிவுகள் பக்கத்திற்குத் திரும்புக" : "Back to Articles"}</span>
        </Link>

        {/* Article Header (Editorial Hierarchy) */}
        <header className="space-y-4">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#111111] dark:text-zinc-100 leading-[1.3] font-tamil-serif text-balance">
            {title}
          </h1>

          {subtitle && (
            <p className="text-base sm:text-lg text-[#3a3a3a] dark:text-zinc-200 font-tamil leading-[1.75] text-pretty">
              {subtitle}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <Badge variant="success" size="md" className="font-tamil">
              {category}
            </Badge>
            <span className="text-xs text-[#555555] dark:text-zinc-400 flex items-center gap-1.5 font-medium">
              <Calendar className="h-3.5 w-3.5 text-[#0A6847] dark:text-emerald-400" />
              {article.publishedAt}
            </span>
            <span className="text-xs text-[#555555] dark:text-zinc-400" aria-hidden="true">•</span>
            <span className="text-xs text-[#555555] dark:text-zinc-400 flex items-center gap-1.5 font-medium">
              <Clock className="h-3.5 w-3.5 text-[#0A6847] dark:text-emerald-400" />
              {article.readingTimeMinutes} {isTa ? "நிமிடம் வாசிப்பு" : "min read"}
            </span>
          </div>

          {/* Author & Action Bar */}
          <div className="pt-4 border-t border-black/8 dark:border-white/10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[#0A6847]/10 dark:bg-emerald-500/20 flex items-center justify-center text-[#0A6847] dark:text-emerald-300 font-bold text-sm">
                {author.charAt(0)}
              </div>
              <div>
                <p className="text-xs text-[#666666] dark:text-zinc-400 font-medium">
                  {isTa ? "ஆசிரியர் / தொகுப்பு" : "Author / Archive"}
                </p>
                <p className="text-sm font-bold text-[#111111] dark:text-zinc-100 font-tamil">{author}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleShare}
                aria-label={isTa ? "பகிர்ந்திடுக" : "Share article"}
                className="min-h-[44px] px-3.5 rounded-xl border border-black/12 dark:border-white/15 hover:border-[#0A6847] dark:hover:border-emerald-400 bg-white/80 dark:bg-zinc-900 hover:bg-[#0A6847]/5 dark:hover:bg-emerald-500/10 text-xs font-bold text-[#222222] dark:text-zinc-100 hover:text-[#0A6847] dark:hover:text-emerald-400 flex items-center gap-2 transition-all cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{isTa ? "இணைப்பு நகலெடுக்கப்பட்டது" : "Copied!"}</span>
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4" />
                    <span>{isTa ? "பகிர்" : "Share"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Hero Image (adaptive frame with ambient blur so portrait & landscape covers never crop heads) */}
        <div className="relative aspect-[16/9] max-h-[520px] w-full rounded-3xl overflow-hidden shadow-lg border border-black/10 dark:border-white/10 bg-zinc-900">
          <Image
            src={normalizedCoverSrc}
            alt=""
            fill
            sizes="(max-width: 1024px) 100vw, 900px"
            className="object-cover scale-110 blur-2xl opacity-55"
            aria-hidden="true"
            priority
          />
          <Image
            src={normalizedCoverSrc}
            alt={coverAlt}
            fill
            sizes="(max-width: 1024px) 100vw, 900px"
            className="object-contain relative z-10"
            priority
          />
        </div>

        {/* Article Body (Optimized Typography for Tamil & English) */}
        <div className="glass-panel rounded-3xl p-6 sm:p-10 lg:p-12 border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#1F1F23] shadow-sm max-w-4xl mx-auto">
          <div
            className="prose prose-neutral dark:prose-invert max-w-none font-tamil text-[#222222] dark:text-zinc-200 text-base sm:text-lg leading-[1.85] space-y-5
              [&>h2]:text-xl sm:[&>h2]:text-2xl [&>h2]:font-bold [&>h2]:font-tamil-serif [&>h2]:text-[#111111] dark:[&>h2]:text-zinc-100 [&>h2]:pt-6 [&>h2]:border-b [&>h2]:border-black/8 dark:[&>h2]:border-white/10 [&>h2]:pb-2.5 [&>h2]:text-balance
              [&>p]:leading-[1.85] [&>p]:text-[#2c2c2c] dark:[&>p]:text-zinc-200 [&>p]:text-pretty
              [&>b]:text-[#111111] dark:[&>b]:text-white [&>strong]:text-[#111111] dark:[&>strong]:text-white [&>strong]:font-semibold
              [&_blockquote_p]:text-zinc-100 [&_blockquote_i]:text-amber-100 [&_blockquote_b]:text-white"
            dangerouslySetInnerHTML={{ __html: formatArticleBodyHtml(content) }}
          />
        </div>

        {/* Peak-End Rule: Related Books CTA banner & Interactive Cards */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-black/10 dark:border-white/10 bg-gradient-to-br from-emerald-50/70 to-amber-50/50 dark:from-emerald-950/50 dark:to-zinc-900 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-[#0A6847] text-white flex items-center justify-center shrink-0">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#111111] dark:text-zinc-100 font-tamil">
                {isTa ? "தொடர்புடைய வரலாற்று நூல்கள்" : "Related Historical Literature"}
              </h3>
              <p className="text-xs text-[#555555] dark:text-zinc-300 font-tamil">
                {isTa
                  ? "இந்த ஆவணம் தொடர்பான மூல நூல்களை மேதகு களஞ்சியத்தில் பெற்று வாசியுங்கள்."
                  : "Order rare authentic books related to this historical topic with safe postal delivery."}
              </p>
            </div>
          </div>

          {/* Grid of actual related book items */}
          {article.relatedBookSlugs && article.relatedBookSlugs.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {article.relatedBookSlugs
                .map((bookSlug) => getBookBySlug(bookSlug))
                .filter((b): b is BookItem => Boolean(b))
                .map((b) => (
                  <div
                    key={b.id}
                    className="p-4 rounded-2xl bg-white/95 dark:bg-zinc-900/95 border border-black/8 dark:border-white/10 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative w-14 aspect-[3/4] rounded-lg overflow-hidden shrink-0 border border-black/10 dark:border-white/15 shadow-xs">
                        <Image
                          src={b.image}
                          alt={isTa ? b.title : b.titleEn}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-[#111111] dark:text-zinc-100 font-tamil line-clamp-2">
                          {isTa ? b.title : b.titleEn}
                        </h4>
                        <p className="text-[11px] font-bold text-[#0A6847] dark:text-emerald-400">
                          {formatINR(b.price)}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-black/6 dark:border-white/10 flex items-center justify-between gap-2">
                      <Link
                        href={`/books/${b.slug}`}
                        className="text-[11px] font-bold text-[#333333] dark:text-zinc-200 hover:text-[#0A6847] dark:hover:text-emerald-400 font-tamil"
                      >
                        {isTa ? "விபரம்" : "Details"}
                      </Link>
                      <a
                        href={`https://wa.me/916384654946?text=${encodeURIComponent(
                          `வணக்கம் மேதகு களஞ்சியம்,\nநான் "${b.title}" (விலை: ₹${b.price}) நூலை வாங்க விரும்புகிறேன்.\nபுத்தகப் பக்கம்: https://methagukalanjiyam.in/books/${b.slug}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-[#0A6847] hover:bg-[#085237] text-white text-[11px] font-bold font-tamil shadow-2xs"
                      >
                        {isTa ? "ஆர்டர் (WA)" : "Order"}
                      </a>
                    </div>
                  </div>
                ))}
            </div>
          )}

          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              href="/books"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0A6847] text-white text-xs font-bold hover:bg-[#085237] transition-all min-h-[44px]"
            >
              <span>{isTa ? "அனைத்து நூல்களின் பட்டியலை காண்க" : "Browse Entire Catalog"}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
