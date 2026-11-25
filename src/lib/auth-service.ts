import { createAdminClient } from "@/lib/supabase/admin";
import {
  constantTimeEqual,
  generateBackupCodes,
  generateSecureOtp,
  generateSecureToken,
  hashSecret,
  normalizeBackupCode,
  signToken,
  verifySecretHash,
  verifySignedToken,
} from "@/lib/auth-crypto";

export {
  constantTimeEqual,
  generateBackupCodes,
  generateSecureOtp,
  generateSecureToken,
  hashSecret,
  normalizeBackupCode,
  signToken,
  verifySecretHash,
  verifySignedToken,
};

function isSchemaMissingError(err: any): boolean {
  const code = String(err?.code || "");
  const msg = String(err?.message || "").toLowerCase();
  return (
    code === "PGRST204" ||
    code === "PGRST205" ||
    code === "42703" ||
    code === "42P01" ||
    msg.includes("does not exist") ||
    msg.includes("could not find")
  );
}

const SENSITIVE_META_KEY = /otp|code|token|secret|password|hash|backup/i;

function sanitizeEventMetadata(meta?: Record<string, unknown>): Record<string, unknown> {
  if (!meta) return {};
  const clean: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(meta)) {
    if (SENSITIVE_META_KEY.test(key)) continue;
    clean[key] = val;
  }
  return clean;
}

/**
 * Records a non-sensitive security/auth audit event into `auth_events` (fallback `audit_logs`).
 * Strictly strips any sensitive secret/OTP/token/backup-code keys before writing.
 */
export async function recordAuthEvent(params: {
  userId?: string | null;
  email?: string | null;
  eventType: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const adminSupabase = createAdminClient();
  const safeMeta = sanitizeEventMetadata(params.metadata);

  try {
    const { error } = await (adminSupabase.from("auth_events") as any).insert({
      user_id: params.userId || null,
      email: params.email ? params.email.toLowerCase().trim() : null,
      event_type: params.eventType,
      ip_address: params.ipAddress || null,
      user_agent: params.userAgent || null,
      metadata: safeMeta,
    });

    if (!error) return;
    if (!isSchemaMissingError(error)) {
      console.warn("[auth_events] insert error:", error.message);
      return;
    }
  } catch {
    // Fall through to legacy audit_logs fallback if migration 021 not applied yet
  }

  try {
    await (adminSupabase.from("audit_logs") as any).insert({
      user_id: params.userId || null,
      action: params.eventType,
      resource_type: "auth",
      resource_id: params.userId || "system",
      ip_address: params.ipAddress || null,
      user_agent: params.userAgent || null,
      metadata: safeMeta,
    });
  } catch {
    // Best-effort audit logging
  }
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
  const hashedCode = await hashSecret(otpCode);
  const preAuthToken = generateSecureToken(32);
  const preAuthTokenHash = await hashSecret(preAuthToken);

  const expiresInMinutes = 10;
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString();

  await (adminSupabase.from("admin_otp_codes") as any)
    .update({ consumed_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("consumed_at", null);

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
  const preAuthHash = await hashSecret(preAuthToken);

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

  const isCorrect = await verifySecretHash(submittedOtp.trim(), record.hashed_code);

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

  await (adminSupabase.from("admin_otp_codes") as any)
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", record.id)
    .is("consumed_at", null);

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

export async function createAdminSession(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<CreateAdminSessionResult> {
  const adminSupabase = createAdminClient();
  const rawToken = generateSecureToken(32);
  const sessionTokenHash = await hashSecret(rawToken);

  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();

  await (adminSupabase.from("admin_sessions") as any).insert({
    user_id: userId,
    session_token_hash: sessionTokenHash,
    ip_address: ipAddress || null,
    user_agent: userAgent || null,
    last_active_at: new Date().toISOString(),
    expires_at: expiresAt,
  });

  const signedToken = await signToken(`${userId}:${rawToken}`);

  return {
    sessionToken: signedToken,
    expiresAt,
  };
}

export async function validateAdminSession(signedSessionToken: string): Promise<{
  valid: boolean;
  userId?: string;
}> {
  if (!signedSessionToken) return { valid: false };

  const payload = await verifySignedToken(signedSessionToken);
  if (!payload) return { valid: false };

  const [userId, rawToken] = payload.split(":");
  if (!userId || !rawToken) return { valid: false };

  const tokenHash = await hashSecret(rawToken);
  const adminSupabase = createAdminClient();

  const { data: session, error } = await (adminSupabase.from("admin_sessions") as any)
    .select("id, expires_at, revoked_at, last_active_at")
    .eq("session_token_hash", tokenHash)
    .eq("user_id", userId)
    .is("revoked_at", null)
    .maybeSingle();

  if (error || !session) return { valid: false };

  const now = Date.now();
  if (new Date(session.expires_at).getTime() < now) {
    return { valid: false };
  }

  const lastActive = new Date(session.last_active_at).getTime();
  if (now - lastActive > 2 * 60 * 60 * 1000) {
    return { valid: false };
  }

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
 * Strict fail-closed server-side admin authorization validator.
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

export async function revokeAdminSession(signedSessionToken: string): Promise<void> {
  const payload = await verifySignedToken(signedSessionToken);
  if (!payload) return;

  const [, rawToken] = payload.split(":");
  if (!rawToken) return;

  const tokenHash = await hashSecret(rawToken);
  const adminSupabase = createAdminClient();

  await (adminSupabase.from("admin_sessions") as any)
    .update({ revoked_at: new Date().toISOString() })
    .eq("session_token_hash", tokenHash);
}

// ============================================================================
// USER EMAIL VERIFICATION TOKENS (Resend + Cooldown + Single-Use)
// ============================================================================

export interface IssueVerificationTokenOutcome {
  issued: boolean;
  rawToken?: string;
  retryAfterSeconds?: number;
}

/**
 * Checks cooldown (default 60s) and issues a 24-hour single-use Web Crypto verification token.
 */
export async function issueUserVerificationToken(
  userId: string,
  email: string,
  cooldownSeconds = 60
): Promise<IssueVerificationTokenOutcome> {
  const adminSupabase = createAdminClient();

  // Check cooldown on most recent issued token for this user (DB-backed)
  if (cooldownSeconds > 0) {
    const { data: latestToken } = await (adminSupabase.from("user_verification_tokens") as any)
      .select("id, created_at, consumed_at")
      .eq("user_id", userId)
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestToken?.created_at) {
      const elapsedSec = Math.floor(
        (Date.now() - new Date(latestToken.created_at).getTime()) / 1000
      );
      if (elapsedSec >= 0 && elapsedSec < cooldownSeconds) {
        return {
          issued: false,
          retryAfterSeconds: cooldownSeconds - elapsedSec,
        };
      }
    }
  }

  const rawToken = generateSecureToken(32);
  const hashedToken = await hashSecret(rawToken);
  const nowIso = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  await (adminSupabase.from("user_verification_tokens") as any)
    .update({ consumed_at: nowIso })
    .eq("user_id", userId)
    .is("consumed_at", null);

  let { error } = await (adminSupabase.from("user_verification_tokens") as any).insert({
    user_id: userId,
    email: email.toLowerCase().trim(),
    hashed_token: hashedToken,
    token_type: "signup_confirmation",
    last_sent_at: nowIso,
    expires_at: expiresAt,
  });

  if (error && isSchemaMissingError(error)) {
    ({ error } = await (adminSupabase.from("user_verification_tokens") as any).insert({
      user_id: userId,
      email: email.toLowerCase().trim(),
      hashed_token: hashedToken,
      token_type: "signup_confirmation",
      expires_at: expiresAt,
    }));
  }

  if (error) {
    throw new Error(`Failed to store verification token: ${error.message}`);
  }

  return { issued: true, rawToken };
}

/**
 * Verifies an email verification token atomically (single-use) and marks Supabase account verified.
 */
export async function verifyUserEmailToken(rawToken: string): Promise<{
  success: boolean;
  userId?: string;
  email?: string;
  error?: string;
}> {
  if (!rawToken || rawToken.trim().length < 32) {
    return { success: false, error: "Invalid verification link." };
  }

  const hashedToken = await hashSecret(rawToken.trim());
  const adminSupabase = createAdminClient();

  const { data: record, error } = await (adminSupabase.from("user_verification_tokens") as any)
    .select("*")
    .eq("hashed_token", hashedToken)
    .is("consumed_at", null)
    .maybeSingle();

  if (error || !record) {
    return { success: false, error: "Verification link is invalid or has already been used." };
  }

  const nowIso = new Date().toISOString();
  if (new Date(record.expires_at).getTime() < Date.now()) {
    await (adminSupabase.from("user_verification_tokens") as any)
      .update({ consumed_at: nowIso })
      .eq("id", record.id);

    return { success: false, error: "Verification link has expired. Please request a new one." };
  }

  // Atomic single-use consumption check to block parallel replay
  const { data: consumedRow, error: consumeErr } = await (
    adminSupabase.from("user_verification_tokens") as any
  )
    .update({ consumed_at: nowIso })
    .eq("id", record.id)
    .is("consumed_at", null)
    .select("id")
    .maybeSingle();

  if (consumeErr || !consumedRow) {
    return { success: false, error: "Verification link has already been consumed." };
  }

  const { error: updateUserError } = await adminSupabase.auth.admin.updateUserById(
    record.user_id,
    {
      email_confirm: true,
      user_metadata: {
        email_verified: true,
        email_verified_at: nowIso,
      },
    }
  );

  if (updateUserError) {
    console.error("Failed to mark user verified in auth.users:", updateUserError.message);
    return { success: false, error: "Failed to confirm user account." };
  }

  await recordAuthEvent({
    userId: record.user_id,
    email: record.email,
    eventType: "email_verified_success",
  });

  return { success: true, userId: record.user_id, email: record.email };
}
