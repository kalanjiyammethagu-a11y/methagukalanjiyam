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

    console.warn(
      `⚠️ [Config Warning] Environment variables configuration issues:\n${errorMessages}`
    );
  }

  validatedEnv = (result.success ? result.data : process.env) as Env;
  return validatedEnv;
}

