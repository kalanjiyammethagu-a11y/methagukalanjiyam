"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
  AlertCircle,
} from "lucide-react";
import { ArchivalWaxSealIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { useLanguage } from "@/context/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/account";
  const { locale } = useLanguage();
  const isTa = locale === "ta";

  const [authMode, setAuthMode] = React.useState<"phone" | "email">("email");
  const [tab, setTab] = React.useState<"login" | "register">("login");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [otpCode, setOtpCode] = React.useState("");
  const [otpSent, setOtpSent] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = React.useState<string | null>(null);
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const supabase = React.useMemo(() => createClient(), []);

  const validate = (field: string, val: string): string | null => {
    if (field === "phone") {
      const clean = val.replace(/\D/g, "");
      if (!val.trim()) return isTa ? "கைபேசி எண்ணை உள்ளிடுக" : "Please enter mobile number";
      if (clean.length < 10) return isTa ? "சரியான 10 இலக்க எண்ணை உள்ளிடுக" : "Enter a valid 10-digit mobile number";
      return null;
    }
    if (field === "email") {
      if (!val.trim()) return isTa ? "மின்னஞ்சலை உள்ளிடுக" : "Please enter email address";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return isTa ? "சரியான மின்னஞ்சலை உள்ளிடுக" : "Enter a valid email address";
      return null;
    }
    if (field === "password") {
      if (!val) return isTa ? "கடவுச்சொல்லை உள்ளிடுக" : "Please enter password";
      if (val.length < 6) return isTa ? "குறைந்தது 6 எழுத்துக்கள் தேவை" : "Password must be at least 6 characters";
      return null;
    }
    if (field === "fullName" && tab === "register") {
      if (!val.trim()) return isTa ? "முழுப் பெயரை உள்ளிடுக" : "Please enter full name";
      if (val.trim().length < 3) return isTa ? "குறைந்தது 3 எழுத்துக்கள் தேவை" : "Name must be at least 3 characters";
      return null;
    }
    if (field === "otp" && otpSent) {
      if (!val.trim() || val.length < 6) return isTa ? "சரியான 6 இலக்க குறியீட்டை உள்ளிடுக" : "Enter 6-digit OTP";
      return null;
    }
    return null;
  };

  const handleBlur = (field: string, val: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const err = validate(field, val);
    setErrors((prev) => {
      const next = { ...prev };
      if (err) next[field] = err;
      else delete next[field];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setServerSuccess(null);

    const newErrors: Record<string, string> = {};
    if (authMode === "phone") {
      const pErr = validate("phone", phone);
      if (pErr) newErrors.phone = pErr;
      if (otpSent) {
        const oErr = validate("otp", otpCode);
        if (oErr) newErrors.otp = oErr;
      }
    } else {
      const eErr = validate("email", email);
      if (eErr) newErrors.email = eErr;
      const passErr = validate("password", password);
      if (passErr) newErrors.password = passErr;
    }
    if (tab === "register") {
      const fnErr = validate("fullName", fullName);
      if (fnErr) newErrors.fullName = fnErr;
    }

    if (Object.keys(newErrors).length > 0) {
      setTouched({ phone: true, email: true, password: true, fullName: true, otp: true });
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      // 1. Email + Password Sign In / Sign Up
      if (authMode === "email") {
        if (tab === "login") {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
          });

          const data = await res.json();

          if (!res.ok) {
            if (data.error === "email_unverified") {
              setServerError(
                isTa
                  ? "உங்கள் மின்னஞ்சல் இன்னும் உறுதிப்படுத்தப்படவில்லை. தயவுசெய்து உங்கள் மின்னஞ்சலில் வந்துள்ள சரிபார்ப்பு இணைப்பை உறுதிப்படுத்தவும்."
                  : "Your email is not verified yet. Please check your inbox for the activation link."
              );
            } else {
              setServerError(
                isTa
                  ? "தவறான மின்னஞ்சல் அல்லது கடவுச்சொல். தயவுசெய்து உங்கள் விவரங்களை சரிபார்க்கவும்."
                  : "Invalid credentials. Please verify your email and password."
              );
            }
            setLoading(false);
            return;
          }

          // Success: Refresh and redirect
          router.push(redirectTo);
          router.refresh();
        } else {
          // Register flow through server-side Resend verification endpoint
          const res = await fetch("/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: email.trim().toLowerCase(),
              password,
              full_name: fullName.trim(),
              locale: isTa ? "ta" : "en",
            }),
          });

          const data = await res.json();

          if (!res.ok) {
            setServerError(
              data.error ||
                (isTa
                  ? "கணக்கு உருவாக்குவதில் சிக்கல் ஏற்பட்டது. தயவுசெய்து மீண்டும் முயற்சிக்கவும்."
                  : "Registration failed. Please try again.")
            );
            setLoading(false);
            return;
          }

          setServerSuccess(
            isTa
              ? "கணக்கு உருவாக்கப்பட்டது! உங்கள் மின்னஞ்சலுக்கு வந்துள்ள சரிபார்ப்பு இணைப்பை உறுதிப்படுத்தவும்."
              : "Account created! Please check your email to verify your registration before logging in."
          );
          setLoading(false);
        }
      } else {
        // 2. Phone OTP flow
        const cleanPhone = phone.replace(/\D/g, "");
        const formattedPhone = `+91${cleanPhone}`;

        if (!otpSent) {
          const { error } = await supabase.auth.signInWithOtp({
            phone: formattedPhone,
          });

          if (error) {
            setServerError(
              error.message ||
                (isTa
                  ? "OTP அனுப்புவதில் சிக்கல் ஏற்பட்டது. தயவுசெய்து மின்னஞ்சல் மூலம் உள்நுழையவும்."
                  : "Failed to send OTP code. Please try using email sign-in.")
            );
            setLoading(false);
            return;
          }

          setOtpSent(true);
          setServerSuccess(
            isTa
              ? `OTP குறியீடு ${formattedPhone} எண்ணிற்கு அனுப்பப்பட்டது.`
              : `OTP code sent to ${formattedPhone}.`
          );
          setLoading(false);
        } else {
          // Verify OTP
          const { error } = await supabase.auth.verifyOtp({
            phone: formattedPhone,
            token: otpCode.trim(),
            type: "sms",
          });

          if (error) {
            setServerError(
              isTa
                ? "தவறான அல்லது காலாவதியான OTP குறியீடு. தயவுசெய்து மீண்டும் முயற்சிக்கவும்."
                : "Invalid or expired OTP code. Please try again."
            );
            setLoading(false);
            return;
          }

          router.push(redirectTo);
          router.refresh();
        }
      }
    } catch (err: any) {
      console.error("Authentication exception:", err);
      setServerError(
        isTa
          ? "சேவையகத்தில் எதிர்பாராத பிழை ஏற்பட்டது. தயவுசெய்து சிறிது நேரம் கழித்து முயற்சிக்கவும்."
          : "An unexpected server error occurred. Please try again."
      );
      setLoading(false);
    }
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
          {/* Brand Story & Trust Reassurance (Order 2 on mobile to keep login form above fold) */}
          <div className="order-2 lg:order-1 lg:col-span-5 glass-panel rounded-3xl p-6 sm:p-8 border border-black/10 bg-gradient-to-br from-emerald-900 via-[#0A6847] to-neutral-900 text-white flex flex-col justify-between space-y-8 shadow-xl">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-white/30 bg-white shrink-0 shadow-md">
                  <Image
                    src="/icons/favicon.png"
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

              <div className="space-y-4 pt-2">
                <h3 className="text-xl sm:text-2xl font-bold font-tamil leading-snug text-white">
                  {isTa
                    ? "வரலாற்றுப் பெட்டகத்தை உங்கள் கைகளில் ஏந்துங்கள்"
                    : "Authentic Historical Tamil Literature"}
                </h3>
                <p className="text-xs sm:text-sm text-emerald-100/90 font-tamil leading-relaxed">
                  {isTa
                    ? "ஆவணப் பதிவுகள், நினைவுக் குறிப்புகள், வரலாற்று ஆய்வுகள் மற்றும் அரிய நூல்களைப் பாதுகாப்பான அஞ்சல் வழி விநியோகத்தில் பெறுங்கள்."
                    : "Access authenticated monographs, historical records, memoirs, and literature delivered securely to your doorstep."}
                </p>
              </div>

              {/* Verified Trust Badges */}
              <div className="space-y-3 pt-4 border-t border-white/15">
                <div className="flex items-center gap-3 text-xs text-emerald-100 font-tamil">
                  <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-3.5 w-3.5 text-amber-300" />
                  </div>
                  <span>{isTa ? "நம்பகமான Razorpay பாதுகாப்பான பரிவர்த்தனை" : "Secure encrypted payments via Razorpay"}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-emerald-100 font-tamil">
                  <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                  </div>
                  <span>{isTa ? "இந்தியா முழுவதும் வேகமான அஞ்சல் சேவை (India Post & ST)" : "All-India insured dispatch (India Post & ST Courier)"}</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/10 flex items-center justify-between text-xs text-emerald-200/70 font-tamil">
              <span>{isTa ? "© 2026 மேதகு களஞ்சியம்" : "© 2026 Methagu Kalanjiyam"}</span>
              <span className="flex items-center gap-1">
                <ArchivalWaxSealIcon className="h-4 w-4 text-amber-400" />
                <span>{isTa ? "அங்கீகரிக்கப்பட்ட காப்பகம்" : "Verified Archive"}</span>
              </span>
            </div>
          </div>

          {/* Form Card (Order 1 on mobile to render above the fold) */}
          <div className="order-1 lg:order-2 lg:col-span-7 glass-panel rounded-3xl p-6 sm:p-10 border border-black/10 bg-white/95 shadow-xl flex flex-col justify-between">
            <div>
              {/* Tab Selector: Login vs Register */}
              <div className="flex items-center p-1 bg-black/[0.04] rounded-2xl mb-6 border border-black/5">
                <button
                  type="button"
                  onClick={() => {
                    setTab("login");
                    setServerError(null);
                    setServerSuccess(null);
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold font-tamil transition-all cursor-pointer min-h-[44px] ${
                    tab === "login"
                      ? "bg-white text-[#0A6847] shadow-sm"
                      : "text-zinc-600 hover:text-zinc-950"
                  }`}
                >
                  {isTa ? "உள்நுழைவு (Sign In)" : "Sign In"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTab("register");
                    setServerError(null);
                    setServerSuccess(null);
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold font-tamil transition-all cursor-pointer min-h-[44px] ${
                    tab === "register"
                      ? "bg-white text-[#0A6847] shadow-sm"
                      : "text-zinc-600 hover:text-zinc-950"
                  }`}
                >
                  {isTa ? "புதிய பதிவு (Register)" : "Create Account"}
                </button>
              </div>

              {/* Title & Context */}
              <div className="mb-6">
                <h1 className="text-xl sm:text-2xl font-bold font-tamil text-[#111111] tracking-tight">
                  {tab === "login"
                    ? isTa
                      ? "வாசகர் உள்நுழைவு"
                      : "Reader Sign In"
                    : isTa
                      ? "புதிய வாசகர் பதிவு"
                      : "New Reader Registration"}
                </h1>
                <p className="text-xs sm:text-sm text-[#555555] font-tamil mt-1">
                  {tab === "login"
                    ? isTa
                      ? "உங்கள் நூலகம் மற்றும் முந்தைய ஆர்டர்களைப் பார்க்க உள்நுழையவும்."
                      : "Access your saved reading list, addresses, and order history."
                    : isTa
                      ? "மேதகு களஞ்சியத்தில் இணைந்து அரிய வரலாற்று நூல்களைப் பெறுங்கள்."
                      : "Create your reader account for expedited checkout and order tracking."}
                </p>
              </div>

              {/* Server-side Alert Feedback */}
              {serverError && (
                <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-tamil flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{serverError}</span>
                </div>
              )}

              {serverSuccess && (
                <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-tamil flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{serverSuccess}</span>
                </div>
              )}

              {/* Auth Mode Toggle: Email vs Phone */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-black/8">
                <span className="text-xs font-semibold text-[#555555] font-tamil">
                  {isTa ? "உள்நுழைவு முறை:" : "Sign In Method:"}
                </span>
                <div className="flex items-center gap-1.5 p-1 bg-black/[0.04] rounded-xl border border-black/5" role="radiogroup">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={authMode === "email"}
                    onClick={() => {
                      setAuthMode("email");
                      setServerError(null);
                    }}
                    className={`min-h-[32px] px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer active:scale-[0.98] ${
                      authMode === "email"
                        ? "bg-white text-[#0A6847] shadow-xs font-bold"
                        : "text-zinc-600 hover:text-zinc-950 hover:bg-black/[0.03]"
                    }`}
                  >
                    {isTa ? "மின்னஞ்சல் (Email)" : "Email Address"}
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={authMode === "phone"}
                    onClick={() => {
                      setAuthMode("phone");
                      setServerError(null);
                    }}
                    className={`min-h-[32px] px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer active:scale-[0.98] ${
                      authMode === "phone"
                        ? "bg-white text-[#0A6847] shadow-xs font-bold"
                        : "text-zinc-600 hover:text-zinc-950 hover:bg-black/[0.03]"
                    }`}
                  >
                    {isTa ? "தொலைபேசி எண் (Phone)" : "Mobile Phone"}
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
                    name="name"
                    autoComplete="name"
                    required
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (touched.fullName) {
                        const err = validate("fullName", e.target.value);
                        setErrors((prev) => ({ ...prev, fullName: err || "" }));
                      }
                    }}
                    onBlur={() => handleBlur("fullName", fullName)}
                    aria-invalid={Boolean(touched.fullName && errors.fullName)}
                    placeholder={isTa ? "எ.கா. க. தமிழரசன்" : "e.g. Tamilarasan"}
                    className={cn(
                      "w-full px-4 py-2.5 rounded-xl border bg-white text-sm font-tamil text-[#111111] placeholder:text-zinc-400 focus:outline-none focus:ring-2 transition-all min-h-[44px]",
                      touched.fullName && errors.fullName
                        ? "border-rose-400 focus:ring-rose-200 focus:border-rose-500"
                        : "border-black/12 focus:ring-[#0A6847]/30 focus:border-[#0A6847]"
                    )}
                  />
                  {touched.fullName && errors.fullName && (
                    <p className="text-xs text-rose-600 font-tamil flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      <span>{errors.fullName}</span>
                    </p>
                  )}
                </div>
              )}

              {authMode === "phone" ? (
                <div className="space-y-3">
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
                        name="phone"
                        autoComplete="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        required
                        disabled={otpSent}
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          if (touched.phone) {
                            const err = validate("phone", e.target.value);
                            setErrors((prev) => ({ ...prev, phone: err || "" }));
                          }
                        }}
                        onBlur={() => handleBlur("phone", phone)}
                        aria-invalid={Boolean(touched.phone && errors.phone)}
                        placeholder="82486 54946"
                        className={cn(
                          "w-full pl-12 pr-4 py-2.5 rounded-xl border bg-white text-sm font-mono text-[#111111] placeholder:text-zinc-400 focus:outline-none focus:ring-2 transition-all min-h-[44px]",
                          touched.phone && errors.phone
                            ? "border-rose-400 focus:ring-rose-200 focus:border-rose-500"
                            : "border-black/12 focus:ring-[#0A6847]/30 focus:border-[#0A6847]",
                          otpSent && "bg-neutral-100 text-neutral-500"
                        )}
                      />
                    </div>
                    {touched.phone && errors.phone && (
                      <p className="text-xs text-rose-600 font-tamil flex items-center gap-1 mt-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        <span>{errors.phone}</span>
                      </p>
                    )}
                  </div>

                  {otpSent && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label htmlFor="login-otp" className="text-xs font-bold text-[#222222] font-tamil block">
                          {isTa ? "OTP குறியீடு (6-digit OTP)" : "6-Digit OTP Code"}
                        </label>
                        <button
                          type="button"
                          onClick={() => setOtpSent(false)}
                          className="text-[11px] font-bold text-[#0A6847] hover:underline cursor-pointer"
                        >
                          {isTa ? "எண்ணை மாற்றுக" : "Change Phone"}
                        </button>
                      </div>
                      <input
                        id="login-otp"
                        type="text"
                        name="otp"
                        inputMode="numeric"
                        maxLength={6}
                        required
                        value={otpCode}
                        onChange={(e) => {
                          setOtpCode(e.target.value);
                          if (touched.otp) {
                            const err = validate("otp", e.target.value);
                            setErrors((prev) => ({ ...prev, otp: err || "" }));
                          }
                        }}
                        onBlur={() => handleBlur("otp", otpCode)}
                        placeholder="123456"
                        className={cn(
                          "w-full px-4 py-2.5 rounded-xl border bg-white text-base tracking-widest text-center font-mono text-[#111111] focus:outline-none focus:ring-2 transition-all min-h-[44px]",
                          touched.otp && errors.otp
                            ? "border-rose-400 focus:ring-rose-200"
                            : "border-black/12 focus:ring-[#0A6847]/30 focus:border-[#0A6847]"
                        )}
                      />
                    </div>
                  )}
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
                      name="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (touched.email) {
                          const err = validate("email", e.target.value);
                          setErrors((prev) => ({ ...prev, email: err || "" }));
                        }
                      }}
                      onBlur={() => handleBlur("email", email)}
                      aria-invalid={Boolean(touched.email && errors.email)}
                      placeholder="name@example.com"
                      className={cn(
                        "w-full px-4 py-2.5 rounded-xl border bg-white text-sm text-[#111111] placeholder:text-zinc-400 focus:outline-none focus:ring-2 transition-all min-h-[44px]",
                        touched.email && errors.email
                          ? "border-rose-400 focus:ring-rose-200 focus:border-rose-500"
                          : "border-black/12 focus:ring-[#0A6847]/30 focus:border-[#0A6847]"
                      )}
                    />
                    {touched.email && errors.email && (
                      <p className="text-xs text-rose-600 font-tamil flex items-center gap-1 mt-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        <span>{errors.email}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="login-password" className="text-xs font-bold text-[#222222] font-tamil block">
                      {isTa ? "கடவுச்சொல் (Password)" : "Password"}
                    </label>
                    <input
                      id="login-password"
                      type="password"
                      name="password"
                      autoComplete={tab === "login" ? "current-password" : "new-password"}
                      required
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (touched.password) {
                          const err = validate("password", e.target.value);
                          setErrors((prev) => ({ ...prev, password: err || "" }));
                        }
                      }}
                      onBlur={() => handleBlur("password", password)}
                      aria-invalid={Boolean(touched.password && errors.password)}
                      placeholder="••••••••"
                      className={cn(
                        "w-full px-4 py-2.5 rounded-xl border bg-white text-sm text-[#111111] placeholder:text-zinc-400 focus:outline-none focus:ring-2 transition-all min-h-[44px]",
                        touched.password && errors.password
                          ? "border-rose-400 focus:ring-rose-200 focus:border-rose-500"
                          : "border-black/12 focus:ring-[#0A6847]/30 focus:border-[#0A6847]"
                      )}
                    />
                    {touched.password && errors.password && (
                      <p className="text-xs text-rose-600 font-tamil flex items-center gap-1 mt-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        <span>{errors.password}</span>
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Submit CTA button (Fitts's Law ≥44px) */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full justify-center min-h-[48px] text-sm font-tamil mt-2 cursor-pointer"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{isTa ? "சரிபார்க்கப்படுகிறது..." : "Authenticating..."}</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span>
                      {authMode === "phone" && !otpSent
                        ? isTa
                          ? "OTP குறியீடு பெறுக"
                          : "Send OTP Code"
                        : tab === "login"
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

            {/* Quick Navigation Footer */}
            <div className="pt-4 border-t border-black/8 text-center space-y-2">
              <p className="text-xs text-[#555555] font-tamil">
                {isTa
                  ? "கணக்கு இல்லாமலும் நீங்கள் தொடரலாம்:"
                  : "Quick navigation without password:"}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/books"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#555555] hover:text-[#111111] hover:underline min-h-[44px] px-2"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>{isTa ? "நூல்களின் பட்டியல்" : "Browse Books"}</span>
                </Link>
                <span className="text-[#999999]">•</span>
                <Link
                  href="/cart"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0A6847] hover:underline min-h-[44px] px-2"
                >
                  <User className="h-3.5 w-3.5" />
                  <span>{isTa ? "கூடை & செக்அவுட்" : "Cart & Checkout"}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-8">
          <div className="w-8 h-8 rounded-full border-2 border-[#0A6847] border-t-transparent animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </React.Suspense>
  );
}
