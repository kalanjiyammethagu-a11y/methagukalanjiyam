"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GlassPanel } from "@/components/ui/GlassPanel";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Log the error for observability
    console.error("Root error boundary caught error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <GlassPanel className="max-w-lg w-full p-8 sm:p-10 rounded-3xl text-center space-y-6 border border-black/10 bg-white/95 shadow-xl">
        {/* Warning Icon Badge */}
        <div className="mx-auto h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-700 shadow-2xs">
          <AlertTriangle className="h-8 w-8" />
        </div>

        {/* Bilingual Error Message */}
        <div className="space-y-2.5">
          <h1 className="text-xl sm:text-2xl font-bold text-[#111111] font-tamil-serif leading-snug">
            தொழில்நுட்பக் கோளாறு ஏற்பட்டுள்ளது
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 font-medium font-sans">
            An unexpected error occurred while loading this page.
          </p>
          <p className="text-xs sm:text-sm text-[#444444] font-tamil leading-relaxed pt-1">
            பக்கத்தை ஏற்றுவதில் எதிர்பாராத பிழை ஏற்பட்டது. தயவுசெய்து மீண்டும் முயற்சிக்கவும் அல்லது முகப்புக்குத் திரும்பவும்.
          </p>
          {error.digest && (
            <p className="text-[11px] font-mono text-zinc-400 pt-1">
              பிழைக் குறியீடு (Error ID): {error.digest}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => reset()}
            className="flex-1 justify-center gap-2 font-tamil min-h-[44px]"
          >
            <RotateCcw className="h-4 w-4" />
            <span>மீண்டும் முயற்சிக்க (Try Again)</span>
          </Button>
          <Button
            href="/"
            variant="outline"
            size="md"
            className="flex-1 justify-center gap-2 font-tamil min-h-[44px]"
          >
            <Home className="h-4 w-4" />
            <span>முகப்புக்குச் செல்க (Home)</span>
          </Button>
        </div>

        {/* Back to catalog link */}
        <div className="pt-4 border-t border-black/8 text-center">
          <Link
            href="/books"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0A6847] hover:underline font-tamil min-h-[44px]"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>நூல்களின் பட்டியலை உலாவுக (Browse Catalog)</span>
          </Link>
        </div>
      </GlassPanel>
    </div>
  );
}
