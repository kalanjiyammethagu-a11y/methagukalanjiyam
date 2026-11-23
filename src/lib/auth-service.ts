import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Derives the server auth secret.
 * Priority: AUTH_SECRET → SUPABASE_SERVICE_ROLE_KEY → RAZORPAY_KEY_SECRET fallback
 */
function getAuthSecret(): string {
  const secret =
    process.env.AUTH_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.RAZORPAY_KEY_SECRET;

  if (!secret) {
    throw new Error("Server authentication secret is missing from environment.");
  }
  return secret;
}

/**
 * Generates a cryptographically strong 6-digit OTP code using CSPRNG.
 */
export function generateSecureOtp(): string {
  // crypto.randomInt is cryptographically secure
  const code = crypto.randomInt(100000, 1000000);
  return code.toString();
}

/**
 * Generates a 256-bit CSPRNG hex token for session or verification links.
 */
export function generateSecureToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

/**
 * Computes HMAC-SHA256 hash of a secret or code.
 */
export function hashSecret(value: string): string {
  const secret = getAuthSecret();
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

/**
 * Constant-time comparison of a value against its stored hash.
 */
export function verifySecretHash(value: string, expectedHash: string): boolean {
  const computed = hashSecret(value);
  if (computed.length !== expectedHash.length) return false;
  return crypto.timingSafeEqual(
    Buffer.from(computed, "utf8"),
    Buffer.from(expectedHash, "utf8")
  );
}

/**
 * Signs a payload string with HMAC-SHA256.
 * Format: payload.signature
 */
export function signToken(payload: string): string {
  const secret = getAuthSecret();
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

/**
 * Verifies and unpacks an HMAC-SHA256 signed token.
 */
export function verifySignedToken(signedToken: string): string | null {
  const parts = signedToken.split(".");
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;
  const secret = getAuthSecret();
  const expectedSig = crypto.createHmac("sha256", secret).update(payload).digest("hex");

  if (signature.length !== expectedSig.length) return null;
  const matches = crypto.timingSafeEqual(
    Buffer.from(signature, "utf8"),
    Buffer.from(expectedSig, "utf8")
  );

  return matches ? payload : null;
}

// ============================================================================
// ADMIN PRE-AUTH & OTP MANAGEMENT
// ============================================================================

export interface IssueAdminOtpResult {
  preAuthToken: string;
  otpCode: string;
  expiresInMinutes: number;
}

/**
 * Issues a new Admin OTP, invalidating any previous active codes for this admin.
 */
export async function issueAdminOtp(userId: string, email: string): Promise<IssueAdminOtpResult> {
  const adminSupabase = createAdminClient();
  const otpCode = generateSecureOtp();
  const hashedCode = hashSecret(otpCode);
  const preAuthToken = generateSecureToken(32);
  const preAuthTokenHash = hashSecret(preAuthToken);

  const expiresInMinutes = 10;
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString();

  // Invalidate previous active codes for this user
  await (adminSupabase.from("admin_otp_codes") as any)
    .update({ consumed_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("consumed_at", null);

  // Insert newly generated OTP code
  const { error } = await (adminSupabase.from("admin_otp_codes") as any).insert({
    user_id: userId,
    email: email.toLowerCase(),
    hashed_code: hashedCode,
    pre_auth_token_hash: preAuthTokenHash,
    attempts: 0,
    max_attempts: 5,
    resend_count: 0,
    last_sent_at: new Date().toISOString(),
    expires_at: expiresAt,
  });

  if (error) {
    throw new Error(`Failed to store admin OTP code: ${error.message}`);
  }

  return {
    preAuthToken,
    otpCode,
    expiresInMinutes,
  };
}

export interface VerifyAdminOtpResult {
  valid: boolean;
  userId?: string;
  email?: string;
  error?: string;
  attemptsLeft?: number;
  lockout?: boolean;
}

/**
 * Verifies an Admin OTP code against a pre-auth token.
 * Single use, max 5 attempts, constant-time validation.
 */
export async function verifyAdminOtp(
  preAuthToken: string,
  submittedOtp: string
): Promise<VerifyAdminOtpResult> {
  const adminSupabase = createAdminClient();
  const preAuthHash = hashSecret(preAuthToken);

  // Find active OTP record bound to this pre-auth token
  const { data: record, error } = await (adminSupabase.from("admin_otp_codes") as any)
    .select("*")
    .eq("pre_auth_token_hash", preAuthHash)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !record) {
    return {
      valid: false,
      error: "Invalid or expired verification session. Please log in again.",
      lockout: true,
    };
  }

  // Check expiration
  if (new Date(record.expires_at).getTime() < Date.now()) {
    await (adminSupabase.from("admin_otp_codes") as any)
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", record.id);

    return {
      valid: false,
      error: "Verification code has expired. Please log in again.",
      lockout: true,
    };
  }

  // Check max attempts
  if (record.attempts >= record.max_attempts) {
    await (adminSupabase.from("admin_otp_codes") as any)
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", record.id);

    return {
      valid: false,
      error: "Maximum verification attempts exceeded. Please restart login.",
      lockout: true,
    };
  }

  // Constant-time hash check
  const isCorrect = verifySecretHash(submittedOtp.trim(), record.hashed_code);

  if (!isCorrect) {
    const updatedAttempts = record.attempts + 1;
    const remaining = Math.max(0, record.max_attempts - updatedAttempts);
    const isNowLocked = remaining <= 0;

    await (adminSupabase.from("admin_otp_codes") as any)
      .update({
        attempts: updatedAttempts,
        consumed_at: isNowLocked ? new Date().toISOString() : null,
      })
      .eq("id", record.id);

    return {
      valid: false,
      attemptsLeft: remaining,
      lockout: isNowLocked,
      error: isNowLocked
        ? "Maximum verification attempts exceeded. Session locked."
        : `Invalid code. ${remaining} attempt(s) remaining.`,
    };
  }

  // Code is valid! Consume it single-use
  await (adminSupabase.from("admin_otp_codes") as any)
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", record.id);

  return {
    valid: true,
    userId: record.user_id,
    email: record.email,
  };
}

// ============================================================================
// ADMIN SESSION CREATION & VERIFICATION
// ============================================================================

export interface CreateAdminSessionResult {
  sessionToken: string;
  expiresAt: string;
}

/**
 * Creates an active admin session after successful Step 2 OTP verification.
 * Shorter timeout: 2 hours idle / 8 hours absolute.
 */
export async function createAdminSession(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<CreateAdminSessionResult> {
  const adminSupabase = createAdminClient();
  const rawToken = generateSecureToken(32);
  const sessionTokenHash = hashSecret(rawToken);

  // 8 hours absolute lifetime
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();

  await (adminSupabase.from("admin_sessions") as any).insert({
    user_id: userId,
    session_token_hash: sessionTokenHash,
    ip_address: ipAddress || null,
    user_agent: userAgent || null,
    last_active_at: new Date().toISOString(),
    expires_at: expiresAt,
  });

  // Return signed session cookie payload
  const signedToken = signToken(`${userId}:${rawToken}`);

  return {
    sessionToken: signedToken,
    expiresAt,
  };
}

/**
 * Validates an admin session cookie.
 */
export async function validateAdminSession(signedSessionToken: string): Promise<{
  valid: boolean;
  userId?: string;
}> {
  if (!signedSessionToken) return { valid: false };

  const payload = verifySignedToken(signedSessionToken);
  if (!payload) return { valid: false };

  const [userId, rawToken] = payload.split(":");
  if (!userId || !rawToken) return { valid: false };

  const tokenHash = hashSecret(rawToken);
  const adminSupabase = createAdminClient();

  const { data: session, error } = await (adminSupabase.from("admin_sessions") as any)
    .select("id, expires_at, revoked_at, last_active_at")
    .eq("session_token_hash", tokenHash)
    .eq("user_id", userId)
    .is("revoked_at", null)
    .maybeSingle();

  if (error || !session) return { valid: false };

  // Check expiration
  const now = Date.now();
  if (new Date(session.expires_at).getTime() < now) {
    return { valid: false };
  }

  // Check idle timeout (2 hours)
  const lastActive = new Date(session.last_active_at).getTime();
  if (now - lastActive > 2 * 60 * 60 * 1000) {
    return { valid: false };
  }

  // Update last active timestamp
  await (adminSupabase.from("admin_sessions") as any)
    .update({ last_active_at: new Date().toISOString() })
    .eq("id", session.id);

  return { valid: true, userId };
}

export interface AdminAuthResult {
  authorized: boolean;
  status: 401 | 403;
  error?: string;
  userId?: string;
  user?: { id: string; role: string; email?: string };
}

/**
 * Strict server-side admin authorization validator.
 * Enforces session token validity AND queries profiles.role === 'admin'.
 * Fails closed: no session = 401, wrong role = 403, query error = deny.
 */
export async function requireAdmin(cookieOrReq: any): Promise<AdminAuthResult> {
  let adminCookie: string | undefined;

  if (typeof cookieOrReq === "string") {
    adminCookie = cookieOrReq;
  } else if (cookieOrReq && typeof cookieOrReq.cookies?.get === "function") {
    adminCookie = cookieOrReq.cookies.get("mk_admin_session")?.value;
  }

  if (!adminCookie) {
    return { authorized: false, status: 401, error: "Unauthorized: Missing admin session" };
  }

  const { valid, userId } = await validateAdminSession(adminCookie);
  if (!valid || !userId) {
    return { authorized: false, status: 401, error: "Unauthorized: Invalid or expired admin session" };
  }

  try {
    const adminSupabase = createAdminClient();
    const { data: profile, error } = await (adminSupabase.from("profiles") as any)
      .select("id, role, email")
      .eq("id", userId)
      .maybeSingle();

    if (error || !profile) {
      return { authorized: false, status: 403, error: "Forbidden: Profile not found or query error" };
    }

    if (profile.role !== "admin") {
      return { authorized: false, status: 403, error: "Forbidden: Admin role required" };
    }

    return {
      authorized: true,
      status: 401,
      userId: profile.id,
      user: { id: profile.id, role: profile.role, email: profile.email },
    };
  } catch (err: any) {
    console.error("[requireAdmin] Verification error:", err);
    return { authorized: false, status: 403, error: "Forbidden: Authorization lookup failure" };
  }
}

/**
 * Revokes an admin session.
 */
export async function revokeAdminSession(signedSessionToken: string): Promise<void> {
  const payload = verifySignedToken(signedSessionToken);
  if (!payload) return;

  const [, rawToken] = payload.split(":");
  if (!rawToken) return;

  const tokenHash = hashSecret(rawToken);
  const adminSupabase = createAdminClient();

  await (adminSupabase.from("admin_sessions") as any)
    .update({ revoked_at: new Date().toISOString() })
    .eq("session_token_hash", tokenHash);
}

// ============================================================================
// USER EMAIL VERIFICATION TOKENS
// ============================================================================

/**
 * Generates and stores a 24-hour single-use email verification token.
 */
export async function issueUserVerificationToken(
  userId: string,
  email: string
): Promise<string> {
  const adminSupabase = createAdminClient();
  const rawToken = generateSecureToken(32);
  const hashedToken = hashSecret(rawToken);

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  // Invalidate any prior unused tokens for this user
  await (adminSupabase.from("user_verification_tokens") as any)
    .update({ consumed_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("consumed_at", null);

  const { error } = await (adminSupabase.from("user_verification_tokens") as any).insert({
    user_id: userId,
    email: email.toLowerCase(),
    hashed_token: hashedToken,
    token_type: "signup_confirmation",
    expires_at: expiresAt,
  });

  if (error) {
    throw new Error(`Failed to store verification token: ${error.message}`);
  }

  return rawToken;
}

/**
 * Verifies an email verification token, marking the user as confirmed.
 */
export async function verifyUserEmailToken(rawToken: string): Promise<{
  success: boolean;
  userId?: string;
  error?: string;
}> {
  if (!rawToken || rawToken.trim().length < 16) {
    return { success: false, error: "Invalid verification link." };
  }

  const hashedToken = hashSecret(rawToken.trim());
  const adminSupabase = createAdminClient();

  const { data: record, error } = await (adminSupabase.from("user_verification_tokens") as any)
    .select("*")
    .eq("hashed_token", hashedToken)
    .is("consumed_at", null)
    .maybeSingle();

  if (error || !record) {
    return { success: false, error: "Verification link is invalid or has already been used." };
  }

  // Check expiration (24h)
  if (new Date(record.expires_at).getTime() < Date.now()) {
    await (adminSupabase.from("user_verification_tokens") as any)
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", record.id);

    return { success: false, error: "Verification link has expired. Please request a new one." };
  }

  // Consume token
  await (adminSupabase.from("user_verification_tokens") as any)
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", record.id);

  // Mark user email confirmed in auth.users via Supabase Admin and update metadata
  const { error: updateUserError } = await adminSupabase.auth.admin.updateUserById(
    record.user_id,
    {
      email_confirm: true,
      user_metadata: {
        email_verified: true,
        email_verified_at: new Date().toISOString(),
      },
    }
  );

  if (updateUserError) {
    console.error("Failed to mark user verified in auth.users:", updateUserError);
    return { success: false, error: "Failed to confirm user account." };
  }

  return { success: true, userId: record.user_id };
}

