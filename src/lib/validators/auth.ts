import { z } from "zod";

/**
 * Strict regex for 6-digit OTP code
 */
const OTP_CODE_REGEX = /^[0-9]{6}$/;

/**
 * Password strength: minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 number
 */
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export const adminLoginStep1Schema = z
  .object({
    email: z.string().trim().email("Please enter a valid administrator email address").max(150),
    password: z.string().min(1, "Password is required").max(200),
  })
  .strict();

export const adminVerifyOtpSchema = z
  .object({
    otp_code: z.string().trim().regex(OTP_CODE_REGEX, "Verification code must be exactly 6 digits"),
  })
  .strict();

export const adminResendOtpSchema = z
  .object({})
  .strict();

export const userSignUpSchema = z
  .object({
    full_name: z.string().trim().min(2, "Full name must be at least 2 characters").max(100),
    email: z.string().trim().email("Please enter a valid email address").max(150),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .max(100)
      .regex(
        PASSWORD_REGEX,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    phone: z
      .string()
      .trim()
      .regex(/^[6-9][0-9]{9}$/, "Enter a valid 10-digit mobile number")
      .optional()
      .or(z.literal("")),
    locale: z.enum(["ta", "en"]).default("ta"),
  })
  .strict();

export const userSignInSchema = z
  .object({
    email: z.string().trim().email("Please enter a valid email address").max(150),
    password: z.string().min(1, "Password is required").max(100),
  })
  .strict();

export const resendVerificationSchema = z
  .object({
    email: z.string().trim().email("Please enter a valid email address").max(150),
  })
  .strict();

// Backward compatibility exports
export const signUpSchema = userSignUpSchema;
export const signInSchema = userSignInSchema;

export type AdminLoginStep1Input = z.infer<typeof adminLoginStep1Schema>;
export type AdminVerifyOtpInput = z.infer<typeof adminVerifyOtpSchema>;
export type UserSignUpInput = z.infer<typeof userSignUpSchema>;
export type UserSignInInput = z.infer<typeof userSignInSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
