"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  RazorpayCheckoutOptions,
  RazorpayPaymentSuccessResponse,
  RazorpayPaymentFailureResponse,
  RazorpayInstance,
} from "@/types/razorpay";
import { ShieldCheck, AlertCircle, RefreshCw, CheckCircle2, ArrowRight } from "lucide-react";
import { formatINR } from "@/lib/utils";

export interface RazorpayCheckoutProps {
  orderId: string; // Supabase order UUID
  orderNumber: string; // Business order number (e.g. MK-123456)
  razorpayOrderId: string; // Razorpay order id (order_...)
  amount: number; // in Paise (e.g. 10000 = ₹100.00)
  currency?: string;
  keyId?: string; // Optional client key override
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  onSuccess?: (response: RazorpayPaymentSuccessResponse) => void;
  onFailure?: (error: RazorpayPaymentFailureResponse) => void;
  onClose?: () => void;
  buttonText?: string;
  buttonClassName?: string;
  disabled?: boolean;
}

type CheckoutStatus =
  | "idle"
  | "loading_script"
  | "ready"
  | "processing"
  | "verifying"
  | "success"
  | "failed"
  | "dismissed";

const RAZORPAY_SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

/**
 * Loads Razorpay checkout.js dynamically into DOM
 */
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }

    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector(`script[src="${RAZORPAY_SCRIPT_SRC}"]`);
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true));
      existingScript.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error("Failed to load Razorpay checkout script");
      resolve(false);
    };

    document.body.appendChild(script);
  });
}

export function RazorpayCheckout({
  orderId,
  orderNumber,
  razorpayOrderId,
  amount,
  currency = "INR",
  keyId,
  prefill,
  notes,
  onSuccess,
  onFailure,
  onClose,
  buttonText,
  buttonClassName,
  disabled = false,
}: RazorpayCheckoutProps) {
  const [status, setStatus] = useState<CheckoutStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [attemptCount, setAttemptCount] = useState<number>(0);

  // Guard against accidental double-clicks or multiple concurrent modals
  const isOpeningRef = useRef(false);

  // Preload script in background on mount
  useEffect(() => {
    loadRazorpayScript().catch(() => {
      // Ignored here; will be retried on click if not yet loaded
    });
  }, []);

  const handlePaymentSuccess = useCallback(
    async (response: RazorpayPaymentSuccessResponse) => {
      setStatus("verifying");
      setErrorMessage(null);

      try {
        const verifyRes = await fetch("/api/orders/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
          }),
        });

        const verifyData = await verifyRes.json();

        if (!verifyRes.ok) {
          throw new Error(verifyData.error || "Payment verification failed on server");
        }

        setStatus("success");
        if (onSuccess) {
          onSuccess(response);
        }
      } catch (err: any) {
        console.error("Verification error:", err);
        setStatus("failed");
        setErrorMessage(
          err.message || "பணம் செலுத்தப்பட்டது, ஆனால் சரிபார்ப்பில் சிக்கல் உள்ளது. தயவுசெய்து எங்களை தொடர்பு கொள்ளவும்."
        );
      } finally {
        isOpeningRef.current = false;
      }
    },
    [onSuccess]
  );

  const openRazorpayModal = useCallback(async () => {
    if (disabled || isOpeningRef.current) return;
    if (status === "processing" || status === "verifying") return;

    isOpeningRef.current = true;
    setStatus("loading_script");
    setErrorMessage(null);

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded || !window.Razorpay) {
      setStatus("failed");
      setErrorMessage("Razorpay payment gateway script failed to load. Please check your network connection.");
      isOpeningRef.current = false;
      return;
    }

    const activeKey =
      keyId ||
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
      "";

    if (!activeKey) {
      setStatus("failed");
      setErrorMessage("Razorpay Key ID is missing. Please configure NEXT_PUBLIC_RAZORPAY_KEY_ID.");
      isOpeningRef.current = false;
      return;
    }

    setStatus("processing");
    setAttemptCount((prev) => prev + 1);

    const options: RazorpayCheckoutOptions = {
      key: activeKey,
      amount,
      currency: "INR",
      name: "மேதகு களஞ்சியம்",
      description: `புத்தக கட்டணம் (${orderNumber})`,
      image: "/images/logo.png",
      order_id: razorpayOrderId,
      handler: (response: RazorpayPaymentSuccessResponse) => {
        handlePaymentSuccess(response);
      },
      prefill: {
        name: prefill?.name || "",
        email: prefill?.email || "",
        contact: prefill?.contact || "",
        method: "upi", // UPI-first preference
      },
      notes: {
        order_id: orderId,
        order_number: orderNumber,
        ...(notes || {}),
      },
      theme: {
        color: "#8B1E0F", // Methagu Kalanjiyam Crimson
        backdrop_color: "rgba(0, 0, 0, 0.65)",
      },
      modal: {
        backdropclose: false,
        escape: true,
        confirm_close: true,
        ondismiss: () => {
          isOpeningRef.current = false;
          setStatus((prev) => (prev === "verifying" || prev === "success" ? prev : "dismissed"));
          if (onClose) {
            onClose();
          }
        },
      },
      retry: {
        enabled: true,
        max_count: 3,
      },
      config: {
        display: {
          blocks: {
            upi: {
              name: "Pay via UPI (GPay, PhonePe, Paytm)",
              instruments: [{ method: "upi" }],
            },
            other: {
              name: "Cards / Netbanking / Wallets",
              instruments: [
                { method: "card" },
                { method: "netbanking" },
                { method: "wallet" },
              ],
            },
          },
          sequence: ["block.upi", "block.other"],
          preferences: {
            show_default_blocks: true,
          },
        },
      },
    };

    try {
      const razorpayInstance = new window.Razorpay(options);

      razorpayInstance.on("payment.failed", (res: RazorpayPaymentFailureResponse) => {
        console.warn("Razorpay payment failure event:", res.error);
        isOpeningRef.current = false;
        setStatus("failed");
        setErrorMessage(
          res.error.description ||
            "பணம் செலுத்துதல் தோல்வியடைந்தது. தயவுசெய்து மீண்டும் முயற்சிக்கவும்."
        );
        if (onFailure) {
          onFailure(res);
        }
      });

      razorpayInstance.open();
    } catch (err: any) {
      console.error("Failed to open Razorpay modal:", err);
      isOpeningRef.current = false;
      setStatus("failed");
      setErrorMessage(err.message || "Failed to initialize payment modal");
    }
  }, [
    disabled,
    status,
    keyId,
    amount,
    orderNumber,
    razorpayOrderId,
    handlePaymentSuccess,
    prefill,
    orderId,
    notes,
    onClose,
    onFailure,
  ]);

  const formattedPrice = formatINR(amount / 100);
  const isLoading = status === "loading_script" || status === "processing" || status === "verifying";

  return (
    <div className="w-full space-y-3 font-sans">
      {/* Primary Payment Action Button */}
      {status !== "success" ? (
        <button
          type="button"
          onClick={openRazorpayModal}
          disabled={disabled || isLoading}
          aria-busy={isLoading}
          className={
            buttonClassName ||
            `w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl text-white font-medium text-base shadow-md transition-all duration-200 active:scale-[0.99] focus:outline-none focus:ring-4 focus:ring-red-900/20 touch-manipulation min-h-[48px] ${
              disabled || isLoading
                ? "bg-stone-400 cursor-not-allowed opacity-80"
                : "bg-[#8B1E0F] hover:bg-[#72180C] hover:shadow-lg"
            }`
          }
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>
                {status === "verifying"
                  ? "சரிபார்க்கிறது... / Verifying..."
                  : "இணைக்கிறது... / Processing..."}
              </span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-5 h-5 text-amber-300" />
              <span>
                {buttonText || `பாதுகாப்பாக பணம் செலுத்த ${formattedPrice} (Pay Now)`}
              </span>
              <ArrowRight className="w-4 h-4 ml-1 opacity-80" />
            </>
          )}
        </button>
      ) : (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-emerald-950">
              பணம் வெற்றிகரமாக செலுத்தப்பட்டது!
            </p>
            <p className="text-sm text-emerald-800">
              Payment confirmed for order {orderNumber}. Thank you for your support!
            </p>
          </div>
        </div>
      )}

      {/* Failure & Retry State UX */}
      {(status === "failed" || status === "dismissed") && (
        <div
          role="alert"
          className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-900 space-y-2 transition-all animate-in fade-in"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-semibold text-red-950">
                {status === "dismissed"
                  ? "பணம் செலுத்துதல் முழுமையடையவில்லை (Payment Cancelled)"
                  : "பணம் செலுத்துதல் தோல்வியடைந்தது (Payment Failed)"}
              </p>
              <p className="mt-1 text-red-800">
                {errorMessage ||
                  "பரிவர்த்தனை ரத்து செய்யப்பட்டது அல்லது தற்காலிக இணைப்பு சிக்கல் ஏற்பட்டுள்ளது."}
              </p>
              {attemptCount > 0 && (
                <p className="mt-1 text-xs text-red-600">
                  முயற்சி (Attempt): {attemptCount}
                </p>
              )}
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={openRazorpayModal}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-red-700 hover:bg-red-800 text-white rounded-xl text-sm font-medium transition-colors shadow-sm touch-manipulation cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>மீண்டும் முயற்சிக்கவும் (Try Again)</span>
            </button>
            <a
              href={`https://wa.me/918248654946?text=${encodeURIComponent(
                `வணக்கம், ஆர்டர் எண் ${orderNumber} கட்டணம் செலுத்துவதில் சிக்கல் உள்ளது. உதவி தேவை.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-white border border-stone-300 hover:bg-stone-50 text-stone-800 rounded-xl text-sm font-medium transition-colors touch-manipulation cursor-pointer"
            >
              <span>வாட்ஸ்அப் உதவி (WhatsApp Help)</span>
            </a>
          </div>
        </div>
      )}

      {/* Trust & Security Badge */}
      <div className="flex items-center justify-center gap-2 text-xs text-stone-500 py-1">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span>100% பாதுகாப்பான Razorpay கட்டண சேவை (UPI, Cards, NetBanking)</span>
      </div>
    </div>
  );
}

export default RazorpayCheckout;
