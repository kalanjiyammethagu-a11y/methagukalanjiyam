import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Home } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { BookCard } from "@/components/books/BookCard";
import { allBooks } from "@/data/books";

export const metadata: Metadata = {
  title: "பக்கம் கிடைக்கவில்லை (404) | Page Not Found — மேதகு களஞ்சியம்",
  description: "நீங்கள் தேடும் பக்கம் மேதகு களஞ்சியத்தில் கிடைக்கவில்லை அல்லது நகர்த்தப்பட்டிருக்கலாம்.",
};

export default function NotFound() {
  const suggestedBooks = allBooks.slice(0, 4);

  return (
    <div className="min-h-[80vh] py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      {/* 404 Hero Card */}
      <GlassPanel className="max-w-2xl mx-auto p-8 sm:p-12 rounded-3xl text-center space-y-6 border border-black/10 dark:border-white/10 bg-white/95 dark:bg-zinc-900/95 shadow-xl">
        <div className="space-y-3">
          <span className="text-5xl sm:text-7xl font-extrabold text-[#0A6847] dark:text-emerald-400 font-mono tracking-tight block">
            404
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111111] dark:text-zinc-100 font-tamil-serif leading-snug">
            பக்கம் கிடைக்கவில்லை
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium font-sans">
            Page Not Found
          </p>
          <p className="text-xs sm:text-sm text-[#444444] dark:text-zinc-300 font-tamil leading-relaxed max-w-md mx-auto">
            நீங்கள் தேடும் பக்கம் மேதகு களஞ்சியத்தில் கிடைக்கவில்லை அல்லது முகவரி மாற்றப்பட்டிருக்கலாம்.
          </p>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
          <Button
            href="/books"
            variant="primary"
            size="md"
            className="justify-center gap-2 font-tamil min-h-[44px]"
          >
            <BookOpen className="h-4 w-4" />
            <span>நூல்களை உலாவுக (Browse Books)</span>
          </Button>
          <Button
            href="/"
            variant="outline"
            size="md"
            className="justify-center gap-2 font-tamil min-h-[44px]"
          >
            <Home className="h-4 w-4" />
            <span>முகப்புக்குச் செல்க (Home)</span>
          </Button>
        </div>
      </GlassPanel>

      {/* Zero Dead-End: Recommended Books */}
      <section className="space-y-6 pt-4 border-t border-black/8 dark:border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#111111] dark:text-zinc-100 font-tamil">
              பரிந்துரைக்கப்படும் வரலாற்று நூல்கள்
            </h2>
            <p className="text-xs sm:text-sm text-[#555555] dark:text-zinc-400 font-tamil">
              Recommended Archival Publications
            </p>
          </div>
          <Link
            href="/books"
            className="text-xs sm:text-sm font-bold text-[#0A6847] dark:text-emerald-400 hover:underline font-tamil flex items-center min-h-[44px]"
          >
            அனைத்தையும் காண்க (View All)
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {suggestedBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              locale="ta"
              variant="compact"
            />
          ))}
        </div>
      </section>
    </div>
  );
}
