"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

function SignUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get("redirectTo") || searchParams.get("redirect") || "/account";
  const redirectTo = rawRedirect.startsWith("/") && !rawRedirect.startsWith("//") ? rawRedirect : "/account";
  const { locale } = useLanguage();
  const isTa = locale === "ta";

  // Multi-step progress: 1 = Credentials, 2 = Profile, 3 = Check Inbox & Verify Email
  const [currentStep, setCurrentStep] = React.useState<1 | 2 | 3>(1);

  // Form Fields
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [fullName, setFullName] = React.useState("");
  const [userLocale, setUserLocale] = React.useState<"ta" | "en">(isTa ? "ta" : "en");

  // UI State
  const [loading, setLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [cooldown, setCooldown] = React.useState(0);
  const [resendMessage, setResendMessage] = React.useState<string | null>(null);

  // Cooldown timer for resend button on step 3
  React.useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Live Password Criteria Calculations
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasUpperCase && hasLowerCase && hasNumber;

  // Step 1 Validation & Proceed
  const handleProceedToProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMessage(
        isTa ? "சரியான மின்னஞ்சல் முகவரியை உள்ளிடுக" : "Please enter a valid email address."
      );
      return;
    }

    if (!isPasswordValid) {
      setErrorMessage(
        isTa
          ? "கடவுச்சொல் தேவையான அனைத்து பாதுகாப்பு விதிகளையும் பூர்த்தி செய்ய வேண்டும்."
          : "Password does not meet all security requirements."
      );
      return;
    }

    setCurrentStep(2);
  };

  // Step 2 Submission & Dispatch
  const handleCompleteSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMessage(
        isTa ? "உங்கள் முழுப் பெயரை உள்ளிடுக" : "Please enter your full name (minimum 2 characters)."
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          full_name: fullName.trim(),
          locale: userLocale,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(
          data.error ||
            (isTa
              ? "பதிவு செய்வதில் சிக்கல் ஏற்பட்டது. தயவுசெய்து மீண்டும் முயற்சிக்கவும்."
              : "Registration could not be completed.")
        );
        setLoading(false);
        return;
      }

      // Step 3: Auto Signed In with active session & Resend verification dispatched
      setCurrentStep(3);
      setCooldown(60);
      setLoading(false);
    } catch {
      setErrorMessage(
        isTa
          ? "சேவையகத்தில் எதிர்பாராத பிழை ஏற்பட்டது. தயவுசெய்து சிறிது நேரம் கழித்து முயற்சிக்கவும்."
          : "An unexpected error occurred. Please try again."
      );
      setLoading(false);
    }
  };

  // Resend confirmation link on step 3
  const handleResendConfirmation = async () => {
    if (cooldown > 0 || loading) return;
    setLoading(true);
    setResendMessage(null);

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();
      setResendMessage(
        data.message ||
          (isTa
            ? "புதிய சரிபார்ப்பு இணைப்பு உங்கள் மின்னஞ்சலுக்கு அனுப்பப்பட்டது."
            : "A fresh verification link has been sent to your inbox.")
      );
      setCooldown(60);
    } catch {
      setResendMessage(
        isTa
          ? "இணைப்பை மீண்டும் அனுப்புவதில் பிழை ஏற்பட்டது."
          : "Failed to resend confirmation email."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 sm:px-6">
      <div className="w-full max-w-lg bg-white dark:bg-[#1a1a1a] rounded-3xl border border-black/10 dark:border-white/10 shadow-xl overflow-hidden">
        {/* Brand Header & Step Progress Bar */}
        <div className="px-6 pt-6 sm:px-8 border-b border-black/8 dark:border-white/8 pb-5">
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full overflow-hidden border border-black/10 bg-white shrink-0">
                <Image
                  src="/icons/favicon.png"
                  alt="Logo"
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-sm font-bold tracking-tight text-[#111111] dark:text-white font-tamil">
                மேதகு களஞ்சியம்
              </span>
            </Link>

            <span className="text-xs text-[#777777] font-medium font-sans">
              {currentStep === 1 && (isTa ? "படி 1 / 3" : "Step 1 of 3")}
              {currentStep === 2 && (isTa ? "படி 2 / 3" : "Step 2 of 3")}
              {currentStep === 3 && (isTa ? "முடிந்தது" : "Verification")}
            </span>
          </div>

          {/* Progress Indicator */}
          <div className="w-full bg-black/5 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#0A6847] h-full transition-all duration-300"
              style={{
                width: currentStep === 1 ? "33%" : currentStep === 2 ? "66%" : "100%",
              }}
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Error Message */}
          {errorMessage && (
            <div
              role="alert"
              className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5"
            >
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
              <span className="leading-relaxed font-tamil">{errorMessage}</span>
            </div>
          )}

          {/* ============================================================
              STEP 1: EMAIL & PASSWORD WITH LIVE VALIDATION
              ============================================================ */}
          {currentStep === 1 && (
            <form onSubmit={handleProceedToProfile} className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-[#111111] dark:text-white font-tamil">
                  {isTa ? "வாசகர் கணக்கு தொடங்குங்கள்" : "Create your Reader Account"}
                </h2>
                <p className="text-xs text-[#666666] dark:text-[#aaaaaa] font-tamil leading-relaxed">
                  {isTa
                    ? "அரிய வரலாற்று நூல்கள் மற்றும் ஆவணங்களை ஆர்டர் செய்ய உங்கள் மின்னஞ்சலை பதிவு செய்யவும்."
                    : "Enter your email and a strong password to begin your archival journey."}
                </p>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label
                  htmlFor="signup-email"
                  className="block text-xs font-semibold text-[#333333] dark:text-[#dddddd] font-tamil"
                >
                  {isTa ? "மின்னஞ்சல் முகவரி" : "Email Address"} *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#888888]" />
                  <input
                    id="signup-email"
                    type="email"
                    required
                    autoFocus
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-black/15 dark:border-white/15 bg-white dark:bg-[#222222] text-base sm:text-sm outline-none focus:border-[#0A6847] focus:ring-1 focus:ring-[#0A6847]"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label
                  htmlFor="signup-password"
                  className="block text-xs font-semibold text-[#333333] dark:text-[#dddddd] font-tamil"
                >
                  {isTa ? "கடவுச்சொல்" : "Password"} *
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#888888]" />
                  <input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full h-11 pl-10 pr-12 rounded-xl border border-black/15 dark:border-white/15 bg-white dark:bg-[#222222] text-base sm:text-sm outline-none focus:border-[#0A6847] focus:ring-1 focus:ring-[#0A6847]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center text-[#777777] hover:text-[#111111] dark:hover:text-white cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Live Password Strength Criteria Checklist */}
              <div className="p-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/5 dark:border-white/5 space-y-1.5 text-[11px]">
                <p className="font-semibold text-[#555555] dark:text-[#aaaaaa] font-tamil">
                  {isTa ? "கடவுச்சொல் தேவைகள்:" : "Password Requirements:"}
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  <div className={`flex items-center gap-1.5 ${hasMinLength ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-[#777777]"}`}>
                    <CheckCircle2 className="h-3 w-3" />
                    <span>8+ {isTa ? "எழுத்துக்கள்" : "characters"}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasUpperCase ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-[#777777]"}`}>
                    <CheckCircle2 className="h-3 w-3" />
                    <span>{isTa ? "பெரிய எழுத்து (A-Z)" : "Uppercase (A-Z)"}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasLowerCase ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-[#777777]"}`}>
                    <CheckCircle2 className="h-3 w-3" />
                    <span>{isTa ? "சிறிய எழுத்து (a-z)" : "Lowercase (a-z)"}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasNumber ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-[#777777]"}`}>
                    <CheckCircle2 className="h-3 w-3" />
                    <span>{isTa ? "எண் (0-9)" : "Number (0-9)"}</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={!isPasswordValid || !email.trim()}
                className="w-full h-11 rounded-xl bg-[#0A6847] hover:bg-[#085036] disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md font-tamil"
              >
                <span>{isTa ? "அடுத்த படிக்கு செல்லவும்" : "Continue to Profile"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <div className="text-center pt-2">
                <p className="text-xs text-[#666666] dark:text-[#aaaaaa] font-tamil">
                  {isTa ? "ஏற்கனவே கணக்கு உள்ளதா?" : "Already have an account?"}{" "}
                  <Link
                    href="/login"
                    className="text-[#0A6847] hover:underline font-bold"
                  >
                    {isTa ? "உள்நுழையவும்" : "Sign In"}
                  </Link>
                </p>
              </div>
            </form>
          )}

          {/* ============================================================
              STEP 2: PROFILE BASICS
              ============================================================ */}
          {currentStep === 2 && (
            <form onSubmit={handleCompleteSignUp} className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-[#111111] dark:text-white font-tamil">
                  {isTa ? "உங்கள் விவரங்கள்" : "Your Profile Details"}
                </h2>
                <p className="text-xs text-[#666666] dark:text-[#aaaaaa] font-tamil leading-relaxed">
                  {isTa
                    ? "ஆர்டர் உறுதிப்படுத்தல் மற்றும் நூல்கள் டெலிவரி செய்ய தேவையான விவரங்கள்."
                    : "Basic details for dispatch notifications and order correspondence."}
                </p>
              </div>

              {/* Full Name */}
              <div className="space-y-1.5">
                <label
                  htmlFor="signup-name"
                  className="block text-xs font-semibold text-[#333333] dark:text-[#dddddd] font-tamil"
                >
                  {isTa ? "முழுப் பெயர்" : "Full Name"} *
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#888888]" />
                  <input
                    id="signup-name"
                    type="text"
                    required
                    autoFocus
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={isTa ? "எ.கா. க. மாதவன்" : "e.g. John Doe"}
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-black/15 dark:border-white/15 bg-white dark:bg-[#222222] text-base sm:text-sm outline-none focus:border-[#0A6847] focus:ring-1 focus:ring-[#0A6847]"
                  />
                </div>
              </div>

              {/* Language Preference */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#333333] dark:text-[#dddddd] font-tamil">
                  {isTa ? "விருப்ப மொழி" : "Preferred Language"}
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs cursor-pointer font-tamil">
                    <input
                      type="radio"
                      name="userLocale"
                      value="ta"
                      checked={userLocale === "ta"}
                      onChange={() => setUserLocale("ta")}
                      className="accent-[#0A6847]"
                    />
                    <span>தமிழ் (Tamil)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs cursor-pointer font-sans">
                    <input
                      type="radio"
                      name="userLocale"
                      value="en"
                      checked={userLocale === "en"}
                      onChange={() => setUserLocale("en")}
                      className="accent-[#0A6847]"
                    />
                    <span>English</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="h-11 px-4 rounded-xl border border-black/15 dark:border-white/15 text-xs font-semibold text-[#444444] dark:text-[#bbbbbb] hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center gap-1.5 cursor-pointer font-tamil"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>{isTa ? "பின்னே" : "Back"}</span>
                </button>

                <button
                  type="submit"
                  disabled={loading || fullName.trim().length < 2}
                  className="flex-1 h-11 rounded-xl bg-[#0A6847] hover:bg-[#085036] disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md font-tamil"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{isTa ? "கணக்கு உருவாக்கப்படுகிறது..." : "Creating Account..."}</span>
                    </>
                  ) : (
                    <>
                      <span>{isTa ? "கணக்கை பதிவு செய்க" : "Create Account"}</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ============================================================
              STEP 3: EMAIL VERIFICATION REQUIRED BEFORE SIGN IN
              ============================================================ */}
          {currentStep === 3 && (
            <div className="space-y-6 text-center py-4">
              <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-[#0A6847] dark:text-emerald-400 mx-auto flex items-center justify-center ring-8 ring-emerald-50 dark:ring-emerald-950/20">
                <Mail className="h-8 w-8 text-[#0A6847]" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-bold text-[#111111] dark:text-white font-tamil leading-snug">
                  {isTa
                    ? "உங்கள் மின்னஞ்சலை உறுதிப்படுத்தவும்!"
                    : "Verify Your Email to Activate Your Account"}
                </h2>
                <p className="text-xs text-[#555555] dark:text-[#aaaaaa] font-tamil max-w-sm mx-auto leading-relaxed">
                  {isTa
                    ? "உங்கள் கணக்கு தொடங்கப்பட்டது. உள்நுழைவதற்கு முன்பு கீழே உள்ள மின்னஞ்சலில் அனுப்பப்பட்டுள்ள சரிபார்ப்பு இணைப்பை (Resend Email Verification) சொடுக்கவும்:"
                    : "We have sent a verification link via Resend to the address below. You must confirm your email before signing in:"}
                </p>
                <p className="text-xs font-mono font-bold text-[#0A6847] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 py-1.5 px-3 rounded-lg inline-block">
                  {email}
                </p>
                <p className="text-[11px] text-[#777777] font-tamil">
                  {isTa
                    ? "இந்த இணைப்பு 24 மணி நேரம் செல்லுபடியாகும். உறுதிப்படுத்திய பிறகு உள்நுழையவும்."
                    : "The link is valid for 24 hours. Once verified, you can sign in and place orders."}
                </p>
              </div>

              {resendMessage && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-tamil">
                  {resendMessage}
                </div>
              )}

              <div className="space-y-3 pt-2">
                <Link
                  href={`/login?redirectTo=${encodeURIComponent(redirectTo)}`}
                  className="w-full h-11 rounded-xl bg-[#0A6847] hover:bg-[#085036] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md font-tamil"
                >
                  <span>
                    {isTa
                      ? "மின்னஞ்சலை உறுதிப்படுத்திய பிறகு உள்நுழையவும் (Go to Sign In)"
                      : "Verified Inbox? Sign In Now"}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={cooldown > 0 || loading}
                  className="w-full h-11 rounded-xl border border-[#0A6847]/30 hover:bg-[#0A6847]/10 disabled:opacity-50 text-[#0A6847] dark:text-emerald-400 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer font-tamil disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  <span>
                    {cooldown > 0
                      ? isTa
                        ? `${cooldown} வினாடிகளில் மீண்டும் அனுப்பலாம்`
                        : `Resend link in ${cooldown}s`
                      : isTa
                      ? "இணைப்பை மீண்டும் அனுப்புக (Resend Email)"
                      : "Resend Verification Email"}
                  </span>
                </button>
              </div>

              <div className="pt-4 border-t border-black/8 dark:border-white/8 text-[11px] text-[#888888] font-tamil">
                <Link href="/verify-email" className="underline hover:text-[#0A6847]">
                  {isTa ? "சரிபார்ப்பு சிக்கலா? இங்கே சொடுக்கவும்" : "Need verification help?"}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-[85vh] flex items-center justify-center p-8">
          <div className="w-8 h-8 rounded-full border-2 border-[#0A6847] border-t-transparent animate-spin" />
        </div>
      }
    >
      <SignUpContent />
    </React.Suspense>
  );
}

