"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, Mail, ArrowRight, Loader2, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();

  const [step, setStep] = React.useState<"credentials" | "otp">("credentials");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [otpCode, setOtpCode] = React.useState(["", "", "", "", "", ""]);
  const [maskedEmail, setMaskedEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [cooldown, setCooldown] = React.useState(0);
  const [attemptsLeft, setAttemptsLeft] = React.useState<number | null>(null);

  const otpInputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown countdown timer
  React.useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // Handle Step 1: Email + Password submission
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Invalid credentials. Please verify your email and password.");
        setLoading(false);
        return;
      }

      // 2FA bypassed: direct session issued — redirect immediately
      if (data.success && data.redirect) {
        setSuccessMessage("Login successful! Redirecting to dashboard...");
        window.location.href = data.redirect;
        return;
      }

      setStep("otp");
      setMaskedEmail(data.email || email);
      setSuccessMessage(data.message || "A 6-digit verification code has been dispatched to your email.");
      setCooldown(60);
      setAttemptsLeft(5);
      setLoading(false);

      if (data.simulatedOtp) {
        const digits = data.simulatedOtp.split("").slice(0, 6);
        setOtpCode(digits);
        setSuccessMessage(`Simulation Mode: Verification Code is ${data.simulatedOtp} (Auto-filled)`);
      }

      // Auto-focus first OTP input on next tick
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } catch {
      setErrorMessage("Network error occurred during authentication. Please retry.");
      setLoading(false);
    }
  };

  // Handle OTP digit changes
  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newCode = [...otpCode];
    newCode[index] = digit;
    setOtpCode(newCode);

    // Auto-advance
    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle OTP backspace
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpCode[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste full OTP
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasteData) return;

    const newCode = [...otpCode];
    for (let i = 0; i < pasteData.length; i++) {
      newCode[i] = pasteData[i];
    }
    setOtpCode(newCode);

    const focusIndex = Math.min(pasteData.length, 5);
    otpInputRefs.current[focusIndex]?.focus();
  };

  // Handle Step 2: OTP submission
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const code = otpCode.join("");
    if (code.length !== 6) {
      setErrorMessage("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/admin/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp_code: code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Invalid verification code.");
        if (data.attemptsLeft !== undefined) {
          setAttemptsLeft(data.attemptsLeft);
        }
        if (data.lockout) {
          setStep("credentials");
          setPassword("");
          setOtpCode(["", "", "", "", "", ""]);
        }
        setLoading(false);
        return;
      }

      setSuccessMessage("Authentication confirmed. Redirecting to administration console...");
      router.push(data.redirect || "/admin");
      router.refresh();
    } catch {
      setErrorMessage("Verification failed due to a network error. Please try again.");
      setLoading(false);
    }
  };

  // Handle Resend OTP Code
  const handleResendOtp = async () => {
    if (cooldown > 0 || loading) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/admin/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Failed to resend verification code.");
        setLoading(false);
        return;
      }

      setSuccessMessage("A fresh verification code has been dispatched.");
      setCooldown(60);
      setLoading(false);
      setOtpCode(["", "", "", "", "", ""]);
      otpInputRefs.current[0]?.focus();
    } catch {
      setErrorMessage("Network error requesting code resend.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F4F5F7] text-gray-900 flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-[#0A6847] selection:text-white">
      {/* Container */}
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
        {/* Header Ribbon */}
        <div className="px-6 py-6 sm:px-8 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full overflow-hidden border border-gray-200 bg-white shrink-0 shadow-sm">
              <Image
                src="/icons/favicon.png"
                alt="Methagu Kalanjiyam"
                width={36}
                height={36}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-gray-900 font-sans">
                Methagu Kalanjiyam
              </h1>
              <p className="text-[10px] tracking-wider uppercase font-semibold text-[#0A6847]">
                Archives Security Gate
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0A6847]/10 border border-[#0A6847]/25 text-[#0A6847] text-[11px] font-mono font-bold">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>2FA Gate</span>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Error Banner */}
          {errorMessage && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5"
            >
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
              <div className="leading-relaxed">
                <span>{errorMessage}</span>
                {attemptsLeft !== null && attemptsLeft > 0 && (
                  <span className="block mt-1 font-semibold text-rose-600">
                    Remaining attempts: {attemptsLeft}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Success Banner */}
          {successMessage && !errorMessage && (
            <div
              role="status"
              className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              <span className="leading-relaxed">{successMessage}</span>
            </div>
          )}

          {/* STEP 1: Email + Password */}
          {step === "credentials" ? (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="admin-email"
                  className="block text-xs font-semibold text-gray-600"
                >
                  Administrator Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="admin-email"
                    type="email"
                    required
                    autoComplete="username"
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@domain.com"
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#0A6847] focus:ring-2 focus:ring-[#0A6847]/20 text-gray-900 text-xs outline-none transition-colors placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="admin-password"
                  className="block text-xs font-semibold text-gray-600"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="admin-password"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#0A6847] focus:ring-2 focus:ring-[#0A6847]/20 text-gray-900 text-xs outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 mt-2 rounded-xl bg-[#0A6847] hover:bg-[#085036] disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Console</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* STEP 2: 6-Digit OTP */
            <form onSubmit={handleOtpSubmit} className="space-y-5">
              <div className="text-center space-y-1">
                <p className="text-xs text-gray-500">
                  Enter the 6-digit authentication code sent to:
                </p>
                <p className="text-xs font-mono font-bold text-[#0A6847]">
                  {maskedEmail}
                </p>
              </div>

              <div
                className="flex items-center justify-center gap-2 sm:gap-2.5"
                onPaste={handleOtpPaste}
              >
                {otpCode.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      otpInputRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-11 h-12 text-center text-lg font-mono font-extrabold rounded-xl bg-gray-50 border border-gray-200 focus:border-[#0A6847] focus:ring-2 focus:ring-[#0A6847]/20 text-gray-900 outline-none transition-all"
                  />
                ))}
              </div>

              <div className="space-y-2">
                <button
                  type="submit"
                  disabled={loading || otpCode.join("").length !== 6}
                  className="w-full h-11 rounded-xl bg-[#0A6847] hover:bg-[#085036] disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Validating Security Code...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      <span>Verify & Enter Console</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("credentials");
                      setOtpCode(["", "", "", "", "", ""]);
                      setErrorMessage(null);
                    }}
                    className="text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                  >
                    ← Back to credentials
                  </button>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={cooldown > 0 || loading}
                    className="text-[#0A6847] hover:text-[#085036] disabled:text-gray-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
                    <span>{cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Security Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-center text-[11px] text-gray-400">
          Strictly authorized personnel only. All access attempts are recorded.
        </div>
      </div>
    </div>
  );
}

