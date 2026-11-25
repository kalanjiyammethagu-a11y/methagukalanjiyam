"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, AlertCircle, Loader2, ArrowRight, RefreshCw, Mail } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const queryStatus = searchParams.get("status");
  const queryMessage = searchParams.get("message");

  const [status, setStatus] = React.useState<"loading" | "success" | "error" | "prompt">(
    queryStatus === "success"
      ? "success"
      : queryStatus === "error"
      ? "error"
      : token
      ? "loading"
      : "prompt"
  );
  const [message, setMessage] = React.useState<string>(
    queryMessage ||
      (queryStatus === "success"
        ? "உங்கள் மின்னஞ்சல் வெற்றிகரமாக உறுதிப்படுத்தப்பட்டது! இப்போது நீங்கள் உள்நுழையலாம். (Email verified successfully)"
        : "")
  );

  const [resendEmail, setResendEmail] = React.useState("");
  const [resendLoading, setResendLoading] = React.useState(false);
  const [resendCooldown, setResendCooldown] = React.useState(0);
  const [resendMessage, setResendMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  // If token is in query param, verify it
  React.useEffect(() => {
    if (!token || queryStatus) return;

    let isMounted = true;

    async function verify() {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (!isMounted) return;

        if (res.ok && data.success) {
          setStatus("success");
          setMessage("உங்கள் மின்னஞ்சல் வெற்றிகரமாக உறுதிப்படுத்தப்பட்டது! (Email verified successfully)");
        } else {
          setStatus("error");
          setMessage(data.error || "சரிபார்ப்பு இணைப்பு காலாவதியாகிவிட்டது அல்லது தவறானது.");
        }
      } catch {
        if (!isMounted) return;
        setStatus("error");
        setMessage("இணைப்பை சரிபார்க்கும் போது பிழை ஏற்பட்டது. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.");
      }
    }

    verify();

    return () => {
      isMounted = false;
    };
  }, [token, queryStatus]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim() || resendCooldown > 0 || resendLoading) return;

    setResendLoading(true);
    setResendMessage(null);

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail.trim() }),
      });

      const data = await res.json();
      setResendMessage(
        data.message ||
          "சரிபார்ப்பு இணைப்பு உங்கள் மின்னஞ்சலுக்கு அனுப்பப்பட்டது. (Verification link sent if eligible.)"
      );
      setResendCooldown(60);
    } catch {
      setResendMessage("பிழை ஏற்பட்டது. தயவுசெய்து சிறிது நேரம் கழித்து முயற்சிக்கவும்.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 sm:px-6">
      <div className="w-full max-w-md bg-white dark:bg-[#1a1a1a] rounded-3xl border border-black/10 dark:border-white/10 p-6 sm:p-8 shadow-xl text-center space-y-6">
        <div className="mx-auto h-12 w-12 rounded-full overflow-hidden border border-black/10 shadow-xs flex items-center justify-center">
          <Image
            src="/icons/favicon.png"
            alt="Methagu Kalanjiyam"
            width={48}
            height={48}
            className="w-full h-full object-cover"
            priority
          />
        </div>

        {status === "loading" && (
          <div className="space-y-4 py-6">
            <Loader2 className="h-10 w-10 text-[#0A6847] animate-spin mx-auto" />
            <h2 className="text-base font-bold text-[#111111] dark:text-white font-tamil">
              மின்னஞ்சலை சரிபார்க்கிறது...
            </h2>
            <p className="text-xs text-[#555555] dark:text-[#aaaaaa] font-sans">
              Verifying your email address, please hold on...
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4 py-4">
            <div className="h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center ring-8 ring-emerald-50 dark:ring-emerald-950/20">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <h2 className="text-lg font-bold text-[#111111] dark:text-white font-tamil">
              சரிபார்ப்பு முடிந்தது!
            </h2>
            <p className="text-xs text-[#444444] dark:text-[#cccccc] leading-relaxed font-tamil">
              {message}
            </p>

            <div className="pt-2">
              <Link
                href="/login"
                className="w-full h-11 rounded-xl bg-[#0A6847] hover:bg-[#085036] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 font-tamil"
              >
                <span>உள்நுழைய செல்லவும் (Go to Login)</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}

        {(status === "error" || status === "prompt") && (
          <div className="space-y-5 py-4">
            <div
              className={`h-14 w-14 rounded-full mx-auto flex items-center justify-center ring-8 ${
                status === "error"
                  ? "bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 ring-rose-50 dark:ring-rose-950/20"
                  : "bg-emerald-100 dark:bg-emerald-950/60 text-[#0A6847] dark:text-emerald-400 ring-emerald-50 dark:ring-emerald-950/20"
              }`}
            >
              {status === "error" ? (
                <AlertCircle className="h-8 w-8" />
              ) : (
                <Mail className="h-8 w-8" />
              )}
            </div>

            <h2 className="text-lg font-bold text-[#111111] dark:text-white font-tamil leading-snug">
              {status === "error"
                ? "சரிபார்ப்பில் சிக்கல் (Verification Issue)"
                : "மின்னஞ்சல் சரிபார்ப்பு (Email Verification)"}
            </h2>
            <p className="text-xs text-[#555555] dark:text-[#aaaaaa] leading-relaxed font-tamil">
              {status === "error"
                ? message || "சரிபார்ப்பு இணைப்பு தவறானது அல்லது காலாவதியாகிவிட்டது."
                : "புதிய சரிபார்ப்பு இணைப்பைப் பெற உங்கள் பதிவு செய்யப்பட்ட மின்னஞ்சலை உள்ளிடவும். Enter your email to receive a new verification link."}
            </p>

            {/* Resend link form */}
            <form onSubmit={handleResend} className="space-y-3 pt-2 text-left">
              <label
                htmlFor="resend-email"
                className="block text-xs font-semibold text-[#444444] dark:text-[#bbbbbb] font-tamil"
              >
                மின்னஞ்சல் முகவரி (Email Address):
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#888888]" />
                <input
                  id="resend-email"
                  type="email"
                  required
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="your-email@example.com"
                  className="w-full min-h-[44px] h-11 pl-9 pr-3 rounded-xl border border-black/15 dark:border-white/15 bg-white dark:bg-[#222222] text-base sm:text-sm outline-none focus:border-[#0A6847]"
                />
              </div>

              {resendMessage && (
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-tamil leading-relaxed">
                  {resendMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={resendLoading || !resendEmail || resendCooldown > 0}
                className="w-full min-h-[44px] h-11 rounded-xl bg-[#0A6847] hover:bg-[#085036] disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer font-tamil disabled:cursor-not-allowed"
              >
                {resendLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                <span>
                  {resendCooldown > 0
                    ? `${resendCooldown} வினாடிகளில் மீண்டும் அனுப்பலாம் (${resendCooldown}s)`
                    : "புதிய இணைப்பை அனுப்புக (Resend Link)"}
                </span>
              </button>
            </form>

            <div className="pt-2 border-t border-black/10 dark:border-white/10">
              <Link
                href="/login"
                className="text-xs text-[#555555] hover:text-[#0A6847] font-semibold underline underline-offset-4"
              >
                உள்நுழைவுப் பக்கத்திற்கு செல்ல (Back to Login)
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center p-8">
          <div className="w-8 h-8 rounded-full border-2 border-[#0A6847] border-t-transparent animate-spin" />
        </div>
      }
    >
      <VerifyEmailContent />
    </React.Suspense>
  );
}

