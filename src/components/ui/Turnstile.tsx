"use client";

import * as React from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        params: {
          sitekey: string;
          callback?: (token: string) => void;
          "error-callback"?: (error?: unknown) => void;
          "expired-callback"?: () => void;
          theme?: "auto" | "light" | "dark";
          size?: "normal" | "flexible" | "compact";
          action?: string;
          cData?: string;
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onTurnstileLoaded?: () => void;
  }
}

export interface TurnstileProps {
  siteKey?: string;
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: (err?: unknown) => void;
  theme?: "auto" | "light" | "dark";
  action?: string;
  className?: string;
}

export function Turnstile({
  siteKey,
  onVerify,
  onExpire,
  onError,
  theme = "auto",
  action = "general",
  className = "",
}: TurnstileProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const widgetIdRef = React.useRef<string | null>(null);

  const key =
    siteKey ||
    process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY ||
    "";

  React.useEffect(() => {
    // If no key configured, warn in dev but avoid breaking UI
    if (!key) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "[Turnstile] No site key configured (NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY)"
        );
      }
      return;
    }

    let isMounted = true;

    function renderWidget() {
      if (!isMounted || !containerRef.current || !window.turnstile) return;
      if (widgetIdRef.current) return; // Already rendered

      try {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: key,
          action,
          theme,
          size: "flexible",
          callback: (token: string) => {
            if (isMounted) onVerify(token);
          },
          "expired-callback": () => {
            if (isMounted && onExpire) onExpire();
          },
          "error-callback": (err: unknown) => {
            if (isMounted && onError) onError(err);
          },
        });
      } catch (e) {
        console.error("[Turnstile] Render error:", e);
      }
    }

    // Check if script already exists
    const SCRIPT_ID = "cf-turnstile-script";
    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        renderWidget();
      };
      document.head.appendChild(script);
    } else if (window.turnstile) {
      renderWidget();
    } else {
      script.addEventListener("load", renderWidget);
    }

    return () => {
      isMounted = false;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {}
        widgetIdRef.current = null;
      }
    };
  }, [key, action, theme, onVerify, onExpire, onError]);

  if (!key) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`min-h-[65px] flex items-center justify-center my-3 ${className}`}
      aria-label="Cloudflare Turnstile Verification"
    />
  );
}
