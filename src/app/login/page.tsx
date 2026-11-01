"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Phone,
  Mail,
  Lock,
  ArrowRight,
  CheckCircle2,
  Loader2,
  BookOpen,
  User,
  ShieldCheck,
} from "lucide-react";
import { ArchivalWaxSealIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { useLanguage } from "@/context/LanguageContext";

export default function LoginPage() {
  const router = useRouter();
  const { locale } = useLanguage();
  const isTa = locale === "ta";

  const [authMode, setAuthMode] = React.useState<"phone" | "email">("phone");
  const [tab, setTab] = React.useState<"login" | "register">("login");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    // Direct reader to their library and delivery profile
    setTimeout(() => {
      router.push("/account");
    }, 1000);
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Top Breadcrumbs */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <Breadcrumbs
          items={[
            { label: isTa ? "உள்நுழைவு" : "Sign In" },
          ]}
        />
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          
          {/* Left Column: Brand Story & Trust Reassurance (Cognitive Load reduction) */}
          <div className="lg:col-span-5 glass-panel rounded-3xl p-6 sm:p-8 border border-black/10 bg-gradient-to-br from-emerald-900 via-[#0A6847] to-neutral-900 text-white flex flex-col justify-between space-y-8 shadow-xl">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-white/30 bg-white shrink-0 shadow-md">
                  <Image
                    src="/icons/icons/favicon.png"
                    alt="மேதகு களஞ்சியம்"
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h2 className="font-bold text-lg font-tamil text-white leading-tight">
                    மேதகு களஞ்சியம்
                  </h2>
                  <p className="text-xs text-emerald-200/80 font-medium tracking-wide">
                    Rare Tamil Literature & Archives
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl sm:text-3xl font-extrabold font-tamil leading-tight text-white">
                  {isTa
                    ? "வரலாற்றுப் பெட்டகத்தின் வாசகராக இணையுங்கள்"
                    : "Join the Sanctuary of Rare Tamil Literature"}
                </h3>
                <p className="text-xs sm:text-sm text-white/80 font-tamil leading-relaxed">
                  {isTa
                    ? "ஆர்டர் கண்காணிப்பு, விருப்பப் பட்டியல், மற்றும் அரிய ஆவணங்களின் புதிய வரவுகள் குறித்த உடனடி அறிவிப்புகளைப் பெறுங்கள்."
                    : "Track your book shipments, manage your library, and receive immediate updates on newly cataloged historical releases."}
                </p>
              </div>

              {/* Trust Checkpoints */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2.5 text-xs text-white/90 font-tamil">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300 shrink-0" />
                  <span>{isTa ? "நூல்கள் கண்காணிப்பு (AWB Tracking)" : "Live Courier AWB Tracking"}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-white/90 font-tamil">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300 shrink-0" />
                  <span>{isTa ? "இந்திய அரசு MSME பதிவு பெற்ற சேவை" : "Govt. MSME Registered Platform"}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-white/90 font-tamil">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300 shrink-0" />
                  <span>{isTa ? "விரைவு அஞ்சல் & ST கூரியர் டெலிவரி" : "Speed Post & ST Courier Delivery"}</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/10 text-xs text-white/70 font-tamil flex items-center gap-2">
              <ArchivalWaxSealIcon className="h-4 w-4 text-emerald-300 shrink-0" />
              <span>{isTa ? "உங்கள் விபரங்கள் 100% பாதுகாப்பானவை" : "Your data is strictly confidential"}</span>
            </div>
          </div>

          {/* Right Column: Interactive Login/Register Form */}
          <div className="lg:col-span-7 glass-panel rounded-3xl p-6 sm:p-10 border border-black/10 bg-white/90 shadow-xl flex flex-col justify-between space-y-6">
            
            {/* Form Header with Login / Register Toggle */}
            <div className="space-y-4">
              <div
                className="p-1 rounded-2xl bg-black/[0.04] backdrop-blur-md border border-black/[0.08] flex items-center gap-1 shadow-2xs"
                role="tablist"
                aria-label={isTa ? "படிவத் தேர்வு" : "Authentication mode"}
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === "login"}
                  onClick={() => setTab("login")}
                  className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all min-h-[40px] font-tamil cursor-pointer active:scale-[0.98] ${
                    tab === "login"
                      ? "bg-white text-[#111111] shadow-xs font-bold"
                      : "text-zinc-600 hover:text-zinc-950 hover:bg-black/[0.03]"
                  }`}
                >
                  {isTa ? "உள்நுழைக (Sign In)" : "Sign In"}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === "register"}
                  onClick={() => setTab("register")}
                  className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all min-h-[40px] font-tamil cursor-pointer active:scale-[0.98] ${
                    tab === "register"
                      ? "bg-white text-[#111111] shadow-xs font-bold"
                      : "text-zinc-600 hover:text-zinc-950 hover:bg-black/[0.03]"
                  }`}
                >
                  {isTa ? "புதிய பதிவு (Register)" : "Register"}
                </button>
              </div>

              {/* Auth Method Selector: Phone OTP vs Email */}
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-600 border-b border-black/8 pb-3">
                <span className="font-tamil">
                  {isTa ? "உள்நுழைவு முறை:" : "Sign in via:"}
                </span>
                <div
                  className="p-0.5 rounded-xl bg-black/[0.04] border border-black/[0.06] flex items-center gap-1 shadow-2xs"
                  role="radiogroup"
                  aria-label={isTa ? "அடையாள முறை" : "Verification channel"}
                >
                  <button
                    type="button"
                    role="radio"
                    aria-checked={authMode === "phone"}
                    onClick={() => setAuthMode("phone")}
                    className={`min-h-[32px] px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer active:scale-[0.98] ${
                      authMode === "phone"
                        ? "bg-white text-[#0A6847] shadow-xs font-bold"
                        : "text-zinc-600 hover:text-zinc-950 hover:bg-black/[0.03]"
                    }`}
                  >
                    {isTa ? "தொலைபேசி எண் (Phone)" : "Mobile Phone"}
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={authMode === "email"}
                    onClick={() => setAuthMode("email")}
                    className={`min-h-[32px] px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer active:scale-[0.98] ${
                      authMode === "email"
                        ? "bg-white text-[#0A6847] shadow-xs font-bold"
                        : "text-zinc-600 hover:text-zinc-950 hover:bg-black/[0.03]"
                    }`}
                  >
                    {isTa ? "மின்னஞ்சல் (Email)" : "Email Address"}
                  </button>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {tab === "register" && (
                <div className="space-y-1.5">
                  <label htmlFor="login-fullName" className="text-xs font-bold text-[#222222] font-tamil block">
                    {isTa ? "முழுப் பெயர் (Full Name)" : "Full Name"}
                  </label>
                  <input
                    id="login-fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={isTa ? "எ.கா. க. தமிழரசன்" : "e.g. Tamilarasan"}
                    className="w-full px-4 py-2.5 rounded-xl border border-black/12 bg-white text-sm font-tamil text-[#111111] placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 focus:border-[#0A6847] transition-all min-h-[44px]"
                  />
                </div>
              )}

              {authMode === "phone" ? (
                <div className="space-y-1.5">
                  <label htmlFor="login-phone" className="text-xs font-bold text-[#222222] font-tamil block">
                    {isTa ? "தொலைபேசி எண் (Mobile Number)" : "Mobile Number"}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#555555]">
                      +91
                    </span>
                    <input
                      id="login-phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="82486 54946"
                      className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-black/12 bg-white text-sm font-mono text-[#111111] placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 focus:border-[#0A6847] transition-all min-h-[44px]"
                    />
                  </div>
                  <p className="text-[11px] text-[#666666] font-tamil">
                    {isTa
                      ? "உங்களின் எண்ணிற்கு ஒருமுறை கடவுச்சொல் (OTP) அனுப்பப்படும்."
                      : "We will send an OTP verification code to this number."}
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label htmlFor="login-email" className="text-xs font-bold text-[#222222] font-tamil block">
                      {isTa ? "மின்னஞ்சல் (Email Address)" : "Email Address"}
                    </label>
                    <input
                      id="login-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-black/12 bg-white text-sm text-[#111111] placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 focus:border-[#0A6847] transition-all min-h-[44px]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="login-password" className="text-xs font-bold text-[#222222] font-tamil block">
                      {isTa ? "கடவுச்சொல் (Password)" : "Password"}
                    </label>
                    <input
                      id="login-password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 rounded-xl border border-black/12 bg-white text-sm text-[#111111] placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 focus:border-[#0A6847] transition-all min-h-[44px]"
                    />
                  </div>
                </>
              )}

              {/* Submit CTA button (Fitts's Law ≥44px) */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full justify-center min-h-[48px] text-sm font-tamil mt-2"
                disabled={submitted}
              >
                {submitted ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{isTa ? "சரிபார்க்கப்படுகிறது..." : "Verifying..."}</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span>
                      {tab === "login"
                        ? isTa
                          ? "உள்நுழைக"
                          : "Sign In"
                        : isTa
                          ? "கணக்கை உருவாக்குக"
                          : "Create Account"}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>

            {/* Guest & Instant Dashboard Alternative */}
            <div className="pt-4 border-t border-black/8 text-center space-y-2">
              <p className="text-xs text-[#555555] font-tamil">
                {isTa
                  ? "கணக்கு இல்லாமலும் நீங்கள் தொடரலாம்:"
                  : "Quick options without password:"}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/account"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0A6847] hover:underline min-h-[44px] px-2"
                >
                  <User className="h-3.5 w-3.5" />
                  <span>{isTa ? "வாசகர் கணக்கு & முகவரி" : "Open Reader Dashboard"}</span>
                </Link>
                <span className="text-[#999999]">•</span>
                <Link
                  href="/books"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#555555] hover:text-[#111111] hover:underline min-h-[44px] px-2"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>{isTa ? "நூல்களின் பட்டியல்" : "Browse Books"}</span>
                </Link>
                <span className="text-[#999999]">•</span>
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg border border-amber-500/30 min-h-[44px] transition-colors"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-amber-700" />
                  <span>{isTa ? "நிர்வாகி மாதிரி (Admin Demo)" : "Admin Portal Demo"}</span>
                </Link>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
