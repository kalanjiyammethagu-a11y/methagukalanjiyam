import { z } from "zod";

export const signUpSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  phone: z.string().regex(/^[0-9]{10}$/, "Enter a valid 10-digit mobile number").optional().or(z.literal("")),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signInSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const guestOtpSchema = z.object({
  phone: z.string().regex(/^[0-9]{10}$/, "Enter a valid 10-digit mobile number"),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type GuestOtpInput = z.infer<typeof guestOtpSchema>;
