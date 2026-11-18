/**
 * Structured logger for production enterprise environments.
 * Automatically redacts sensitive fields (passwords, tokens, cards, secrets)
 * and formats output as JSON in production for log ingestion engines.
 */

const REDACTED_KEYS = new Set([
  "password",
  "token",
  "secret",
  "key",
  "authorization",
  "cookie",
  "signature",
  "razorpay_signature",
  "razorpay_key_secret",
  "service_role",
  "credit_card",
  "cvv",
]);

function redactSensitiveData(data: unknown): unknown {
  if (!data || typeof data !== "object") {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(redactSensitiveData);
  }

  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (REDACTED_KEYS.has(key.toLowerCase())) {
      clean[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      clean[key] = redactSensitiveData(value);
    } else {
      clean[key] = value;
    }
  }

  return clean;
}

export type LogLevel = "debug" | "info" | "warn" | "error";

export function log(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>
) {
  const timestamp = new Date().toISOString();
  const safeContext = context ? redactSensitiveData(context) : undefined;

  const logEntry = {
    timestamp,
    level,
    message,
    ...(safeContext && typeof safeContext === "object" ? safeContext : {}),
  };

  if (process.env.NODE_ENV === "production") {
    console[level === "debug" ? "log" : level](JSON.stringify(logEntry));
  } else {
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    if (level === "error") {
      console.error(prefix, message, safeContext || "");
    } else if (level === "warn") {
      console.warn(prefix, message, safeContext || "");
    } else {
      console.log(prefix, message, safeContext || "");
    }
  }
}

export const logger = {
  debug: (msg: string, ctx?: Record<string, unknown>) => log("debug", msg, ctx),
  info: (msg: string, ctx?: Record<string, unknown>) => log("info", msg, ctx),
  warn: (msg: string, ctx?: Record<string, unknown>) => log("warn", msg, ctx),
  error: (msg: string, ctx?: Record<string, unknown>) => log("error", msg, ctx),
};

