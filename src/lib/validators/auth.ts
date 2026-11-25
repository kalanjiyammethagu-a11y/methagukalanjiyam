import { z } from "zod";

const OTP_CODE_REGEX = /^[0-9]{6}$/;
const BACKUP_CODE_REGEX = /^[A-Za-z0-9-]{8,16}$/;
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

export const adminVerifyBackupCodeSchema = z
  .object({
    backup_code: z
      .string()
      .trim()
      .regex(BACKUP_CODE_REGEX, "Backup code must be 8 alphanumeric characters (XXXX-XXXX)"),
  })
  .strict();

export const adminStep2ChallengeSchema = z.union([
  adminVerifyOtpSchema,
  adminVerifyBackupCodeSchema,
]);

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

export const signUpSchema = userSignUpSchema;
export const signInSchema = userSignInSchema;

export type AdminLoginStep1Input = z.infer<typeof adminLoginStep1Schema>;
export type AdminVerifyOtpInput = z.infer<typeof adminVerifyOtpSchema>;
export type AdminVerifyBackupCodeInput = z.infer<typeof adminVerifyBackupCodeSchema>;
export type AdminStep2ChallengeInput = z.infer<typeof adminStep2ChallengeSchema>;
export type UserSignUpInput = z.infer<typeof userSignUpSchema>;
export type UserSignInInput = z.infer<typeof userSignInSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
