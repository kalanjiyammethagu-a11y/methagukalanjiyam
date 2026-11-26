import { z } from "zod";

/**
 * Validates critical environment variables at startup.
 * Throws a formatted error if required variables are missing or malformed.
 */
const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("Invalid Supabase URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(10, "Supabase anon key is required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10, "Supabase service role key is required").optional(),
  
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

  ERP_URL: z.string().url("Invalid ERP URL").optional(),
  ERP_API_KEY: z.string().optional(),
  ERP_API_SECRET: z.string().optional(),
  ERP_ENABLED: z.string().optional(),
  ERP_AUTO_SYNC_ORDERS: z.string().optional(),
  ERP_COMPANY: z.string().optional(),
  ERP_DEFAULT_ITEM_GROUP: z.string().optional(),
  ERP_SYNC_TOKEN: z.string().optional(),

  AUTH_SECRET: z.string().min(16, "AUTH_SECRET must be at least 16 characters").optional(),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().optional(),

  NEXT_PUBLIC_SITE_URL: z.string().url("Invalid site URL").default("https://methagukalanjiyam.in"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export type Env = z.infer<typeof envSchema>;

let validatedEnv: Env | null = null;

export function getValidatedEnv(): Env {
  if (validatedEnv) {
    return validatedEnv;
  }

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errorMessages = Object.entries(result.error.flatten().fieldErrors)
      .map(([key, errors]) => `  - ${key}: ${errors?.join(", ")}`)
      .join("\n");

    if (process.env.NODE_ENV === "production") {
      throw new Error(
        `[FATAL] Missing or invalid production environment variables:\n${errorMessages}`
      );
    } else {
      console.warn(
        `⚠️ [Config Warning] Environment variables configuration issues:\n${errorMessages}`
      );
    }
  }

  validatedEnv = (result.success ? result.data : process.env) as Env;
  return validatedEnv;
}

/**
 * Enforces that a required server secret is defined and not a default placeholder.
 * Throws a fatal error if missing or placeholder.
 */
export function requireServerEnv(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === "" || value.includes("placeholder")) {
    throw new Error(
      `[FATAL] Required server secret "${key}" is missing or unconfigured.`
    );
  }
  return value.trim();
}

