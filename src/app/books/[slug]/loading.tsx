import * as React from "react";

export default function BookDetailLoading() {
  return (
    <div
      className="min-h-screen pb-24 sm:pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 animate-pulse"
      role="status"
      aria-label="நூல் விவரங்கள் ஏற்றப்படுகின்றன... / Loading book details..."
    >
      {/* Breadcrumbs Skeleton */}
      <div className="flex items-center gap-2 mb-8">
        <div className="h-4 w-16 rounded bg-black/10 dark:bg-white/10" />
        <div className="h-4 w-4 rounded bg-black/10 dark:bg-white/10" />
        <div className="h-4 w-24 rounded bg-black/10 dark:bg-white/10" />
        <div className="h-4 w-4 rounded bg-black/10 dark:bg-white/10" />
        <div className="h-4 w-40 rounded bg-black/10 dark:bg-white/10" />
      </div>

      {/* Product Hero Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 pb-12 sm:pb-16">
        {/* Left: Cover Gallery Skeleton */}
        <div className="lg:col-span-5">
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-black/8 dark:border-white/10 shadow-2xs space-y-6">
            <div className="flex justify-center">
              <div className="w-56 sm:w-64 lg:w-72 aspect-[3/4] rounded-2xl bg-black/[0.07] dark:bg-white/[0.07] border border-black/5 dark:border-white/10" />
            </div>
            {/* Share button skeleton */}
            <div className="flex justify-center pt-2">
              <div className="h-11 w-32 rounded-xl bg-black/10 dark:bg-white/10" />
            </div>
          </div>
        </div>

        {/* Right: Details Skeleton */}
        <div className="lg:col-span-7 space-y-6">
          {/* Title Hierarchy */}
          <div className="space-y-3">
            <div className="h-9 sm:h-11 w-4/5 rounded-2xl bg-black/10 dark:bg-white/10" />
            <div className="h-4 w-1/2 rounded bg-black/[0.06] dark:bg-white/[0.06]" />
            <div className="flex items-center gap-3 pt-1">
              <div className="h-6 w-24 rounded-full bg-[#0A6847]/15 dark:bg-emerald-500/20" />
              <div className="h-4 w-36 rounded bg-black/10 dark:bg-white/10" />
            </div>
          </div>

          {/* Price & CTA GlassPanel Skeleton */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-black/8 dark:border-white/10 space-y-5">
            <div className="flex justify-between items-baseline">
              <div className="h-10 w-28 rounded-xl bg-black/10 dark:bg-white/10" />
              <div className="h-6 w-32 rounded-full bg-black/10 dark:bg-white/10" />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="h-12 w-32 rounded-2xl bg-black/10 dark:bg-white/10" />
              <div className="h-12 flex-1 rounded-2xl bg-[#0A6847]/20 dark:bg-emerald-500/25" />
            </div>
            <div className="h-10 w-full rounded-xl bg-black/[0.04] dark:bg-white/[0.04]" />
            <div className="h-4 w-3/4 rounded bg-black/[0.06] dark:bg-white/[0.06]" />
          </div>

          {/* Tabs Skeleton */}
          <div className="space-y-4">
            <div className="h-10 w-64 rounded-2xl bg-black/[0.05] dark:bg-white/[0.06]" />
            <div className="space-y-2.5 pt-2">
              <div className="h-4 w-full rounded bg-black/[0.07] dark:bg-white/[0.07]" />
              <div className="h-4 w-11/12 rounded bg-black/[0.07] dark:bg-white/[0.07]" />
              <div className="h-4 w-4/5 rounded bg-black/[0.07] dark:bg-white/[0.07]" />
              <div className="h-4 w-3/4 rounded bg-black/[0.06] dark:bg-white/[0.06]" />
            </div>
          </div>
        </div>
      </div>

      {/* Related Books Skeleton */}
      <div className="py-12 border-t border-black/8 dark:border-white/10 space-y-6">
        <div className="h-7 w-64 rounded-xl bg-black/10 dark:bg-white/10" />
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-black/8 dark:border-white/10 bg-white dark:bg-zinc-900 p-3 space-y-3">
              <div className="aspect-[3/4] rounded-lg bg-black/[0.06] dark:bg-white/[0.06]" />
              <div className="h-4 w-3/4 rounded bg-black/10 dark:bg-white/10" />
              <div className="h-3 w-1/2 rounded bg-black/[0.06] dark:bg-white/[0.06]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
