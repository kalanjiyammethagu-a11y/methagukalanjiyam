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
// ADMIN PRE-AUTH & OTP CHALLENGE MANAGEMENT (admin_otp_challenges -> admin_otp_codes fallback)
// ============================================================================

type OtpChallengeTable = "admin_otp_challenges" | "admin_otp_codes";

interface NormalizedOtpRecord {
  table: OtpChallengeTable;
  id: string;
  user_id: string;
  email: string;
  otp_hash: string;
  pre_auth_token_hash: string;
  attempts: number;
  max_attempts: number;
  resend_count: number;
  last_sent_at: string;
  expires_at: string;
  consumed_at: string | null;
}

async function resolveActiveChallenge(preAuthHash: string): Promise<NormalizedOtpRecord | null> {
  const adminSupabase = createAdminClient();

  for (const table of ["admin_otp_challenges", "admin_otp_codes"] as const) {
    const { data, error } = await (adminSupabase.from(table) as any)
      .select("*")
      .eq("pre_auth_token_hash", preAuthHash)
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return {
        table,
        id: data.id,
        user_id: data.user_id,
        email: data.email,
        otp_hash: data.otp_hash || data.hashed_code,
        pre_auth_token_hash: data.pre_auth_token_hash,
        attempts: Number(data.attempts || 0),
        max_attempts: Number(data.max_attempts || 5),
        resend_count: Number(data.resend_count || 0),
        last_sent_at: data.last_sent_at || data.created_at,
        expires_at: data.expires_at,
        consumed_at: data.consumed_at,
      };
    }

    if (error && !isSchemaMissingError(error)) {
      return null;
    }
  }

  return null;
}

async function consumeChallengeRow(table: OtpChallengeTable, id: string): Promise<boolean> {
  const adminSupabase = createAdminClient();
  const { data } = await (adminSupabase.from(table) as any)
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", id)
    .is("consumed_at", null)
    .select("id")
    .maybeSingle();
  return Boolean(data);
}

export interface IssueAdminOtpResult {
  preAuthToken: string;
  otpCode: string;
  expiresInMinutes: number;
}

/**
 * Issues a new 6-digit Admin OTP challenge (10m expiry, max 5 attempts) using Web Crypto CSPRNG.
 */
export async function issueAdminOtp(userId: string, email: string): Promise<IssueAdminOtpResult> {
  const adminSupabase = createAdminClient();
  const otpCode = generateSecureOtp();
  const otpHash = await hashSecret(otpCode);
  const preAuthToken = generateSecureToken(32);
  const preAuthTokenHash = await hashSecret(preAuthToken);

  const nowIso = new Date().toISOString();
  const expiresInMinutes = 10;
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString();

  // Invalidate prior active challenges on both tables cleanly
  for (const table of ["admin_otp_challenges", "admin_otp_codes"] as const) {
    try {
      await (adminSupabase.from(table) as any)
        .update({ consumed_at: nowIso })
        .eq("user_id", userId)
        .is("consumed_at", null);
    } catch {
      // Ignore if legacy/new table missing
    }
  }

  let { error } = await (adminSupabase.from("admin_otp_challenges") as any).insert({
    user_id: userId,
    email: email.toLowerCase().trim(),
    otp_hash: otpHash,
    pre_auth_token_hash: preAuthTokenHash,
    attempts: 0,
    max_attempts: 5,
    resend_count: 0,
    last_sent_at: nowIso,
    expires_at: expiresAt,
  });

  if (error && isSchemaMissingError(error)) {
    ({ error } = await (adminSupabase.from("admin_otp_codes") as any).insert({
      user_id: userId,
      email: email.toLowerCase().trim(),
      hashed_code: otpHash,
      pre_auth_token_hash: preAuthTokenHash,
      attempts: 0,
      max_attempts: 5,
      resend_count: 0,
      last_sent_at: nowIso,
      expires_at: expiresAt,
    }));
  }

  if (error) {
    throw new Error(`Failed to store admin OTP challenge: ${error.message}`);
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
  usedBackupCode?: boolean;
}

/**
 * Verifies a 6-digit Admin OTP against an active pre-auth challenge.
 * Single-use atomic consume, max 5 attempts, constant-time validation.
 */
export async function verifyAdminOtp(
  preAuthToken: string,
  submittedOtp: string
): Promise<VerifyAdminOtpResult> {
  const adminSupabase = createAdminClient();
  const preAuthHash = await hashSecret(preAuthToken);
  const record = await resolveActiveChallenge(preAuthHash);

  if (!record) {
    return {
      valid: false,
      error: "Invalid or expired verification session. Please log in again.",
      lockout: true,
    };
  }

  if (new Date(record.expires_at).getTime() < Date.now()) {
    await consumeChallengeRow(record.table, record.id);
    return {
      valid: false,
      userId: record.user_id,
      email: record.email,
      error: "Verification code has expired. Please log in again.",
      lockout: true,
    };
  }

  if (record.attempts >= record.max_attempts) {
    await consumeChallengeRow(record.table, record.id);
    return {
      valid: false,
      userId: record.user_id,
      email: record.email,
      error: "Maximum verification attempts exceeded. Please restart login.",
      lockout: true,
    };
  }

  const isCorrect = await verifySecretHash(submittedOtp.trim(), record.otp_hash);

  if (!isCorrect) {
    const updatedAttempts = record.attempts + 1;
    const remaining = Math.max(0, record.max_attempts - updatedAttempts);
    const isNowLocked = remaining <= 0;

    await (adminSupabase.from(record.table) as any)
      .update({
        attempts: updatedAttempts,
        consumed_at: isNowLocked ? new Date().toISOString() : null,
      })
      .eq("id", record.id);

    return {
      valid: false,
      userId: record.user_id,
      email: record.email,
      attemptsLeft: remaining,
      lockout: isNowLocked,
      error: isNowLocked
        ? "Maximum verification attempts exceeded. Session locked."
        : `Invalid code. ${remaining} attempt(s) remaining.`,
    };
  }

  const consumed = await consumeChallengeRow(record.table, record.id);
  if (!consumed) {
    return {
      valid: false,
      error: "Verification challenge has already been used.",
      lockout: true,
    };
  }

  return {
    valid: true,
    userId: record.user_id,
    email: record.email,
  };
}

export interface ResendAdminOtpResult {
  ok: boolean;
  status: 200 | 401 | 429 | 500;
  otpCode?: string;
  email?: string;
  userId?: string;
  retryAfterSeconds?: number;
  error?: string;
}

/**
 * Rotates a pending admin OTP challenge respecting a 60s resend cooldown and max 3 resends.
 */
export async function rotateAdminOtpChallenge(preAuthToken: string): Promise<ResendAdminOtpResult> {
  const adminSupabase = createAdminClient();
  const preAuthHash = await hashSecret(preAuthToken);
  const record = await resolveActiveChallenge(preAuthHash);

  if (!record) {
    return {
      ok: false,
      status: 401,
      error: "No active verification session found. Please sign in again.",
    };
  }

  const cooldownMs = 60 * 1000;
  const timeSinceLast = Date.now() - new Date(record.last_sent_at).getTime();
  if (timeSinceLast >= 0 && timeSinceLast < cooldownMs) {
    const waitSeconds = Math.ceil((cooldownMs - timeSinceLast) / 1000);
    return {
      ok: false,
      status: 429,
      retryAfterSeconds: waitSeconds,
      error: `Please wait ${waitSeconds} seconds before requesting a new code.`,
    };
  }

  if (record.resend_count >= 3) {
    return {
      ok: false,
      status: 429,
      error: "Maximum resend limit reached for this session. Please restart login from Step 1.",
    };
  }

  const newOtpCode = generateSecureOtp();
  const newOtpHash = await hashSecret(newOtpCode);
  const nowIso = new Date().toISOString();
  const newExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const updateFields =
    record.table === "admin_otp_challenges"
      ? {
          otp_hash: newOtpHash,
          resend_count: record.resend_count + 1,
          attempts: 0,
          last_sent_at: nowIso,
          expires_at: newExpiresAt,
        }
      : {
          hashed_code: newOtpHash,
          resend_count: record.resend_count + 1,
          attempts: 0,
          last_sent_at: nowIso,
          expires_at: newExpiresAt,
        };

  const { error } = await (adminSupabase.from(record.table) as any)
    .update(updateFields)
    .eq("id", record.id);

  if (error) {
    return { ok: false, status: 500, error: "Failed to rotate verification code." };
  }

  return {
    ok: true,
    status: 200,
    otpCode: newOtpCode,
    email: record.email,
    userId: record.user_id,
  };
}

// ============================================================================
// ADMIN SINGLE-USE BACKUP CODES (8 HASHED CODES)
// ============================================================================

/**
 * Generates 8 fresh backup recovery codes for an admin user, replacing any unused prior codes.
 * Plaintext codes are returned ONCE and never stored or logged.
 */
export async function issueAdminBackupCodes(userId: string): Promise<{ codes: string[] }> {
  const adminSupabase = createAdminClient();
  const codes = generateBackupCodes(8);
  const nowIso = new Date().toISOString();

  // Invalidate any previously unconsumed backup codes
  await (adminSupabase.from("admin_backup_codes") as any)
    .update({ used_at: nowIso })
    .eq("user_id", userId)
    .is("used_at", null);

  const rows = await Promise.all(
    codes.map(async (code) => ({
      user_id: userId,
      code_hash: await hashSecret(normalizeBackupCode(code)),
      used_at: null,
    }))
  );

  const { error } = await (adminSupabase.from("admin_backup_codes") as any).insert(rows);
  if (error) {
    throw new Error(`Failed to save admin backup codes: ${error.message}`);
  }

  return { codes };
}

export async function getAdminBackupCodesCount(userId: string): Promise<number> {
  const adminSupabase = createAdminClient();
  const { count, error } = await (adminSupabase.from("admin_backup_codes") as any)
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("used_at", null);

  if (error) return 0;
  return Number(count || 0);
}

/**
 * Verifies a single-use backup code against an active Step 1 pre-auth session.
 * Shares the same max-5 brute-force attempt counter and consumes both the backup code and challenge atomically.
 */
export async function verifyAdminBackupCode(
  preAuthToken: string,
  submittedCode: string
): Promise<VerifyAdminOtpResult> {
  const adminSupabase = createAdminClient();
  const preAuthHash = await hashSecret(preAuthToken);
  const record = await resolveActiveChallenge(preAuthHash);

  if (!record) {
    return {
      valid: false,
      error: "Invalid or expired verification session. Please log in again.",
      lockout: true,
    };
  }

  if (new Date(record.expires_at).getTime() < Date.now()) {
    await consumeChallengeRow(record.table, record.id);
    return {
      valid: false,
      userId: record.user_id,
      email: record.email,
      error: "Pre-authentication session expired. Please log in again.",
      lockout: true,
    };
  }

  if (record.attempts >= record.max_attempts) {
    await consumeChallengeRow(record.table, record.id);
    return {
      valid: false,
      userId: record.user_id,
      email: record.email,
      error: "Maximum verification attempts exceeded. Session locked.",
      lockout: true,
    };
  }

  const normalized = normalizeBackupCode(submittedCode);
  const candidateHash = await hashSecret(normalized);

  const { data: activeCodes, error: fetchErr } = await (
    adminSupabase.from("admin_backup_codes") as any
  )
    .select("id, code_hash")
    .eq("user_id", record.user_id)
    .is("used_at", null);

  if (fetchErr || !Array.isArray(activeCodes)) {
    return {
      valid: false,
      userId: record.user_id,
      email: record.email,
      error: "Backup code verification unavailable.",
    };
  }

  // Evaluate every unused code in constant time without short-circuiting
  let matchedRowId: string | null = null;
  for (const row of activeCodes) {
    if (constantTimeEqual(candidateHash, String(row.code_hash || "").toLowerCase())) {
      matchedRowId = row.id;
    }
  }

  if (!matchedRowId) {
    const updatedAttempts = record.attempts + 1;
    const remaining = Math.max(0, record.max_attempts - updatedAttempts);
    const isNowLocked = remaining <= 0;

    await (adminSupabase.from(record.table) as any)
      .update({
        attempts: updatedAttempts,
        consumed_at: isNowLocked ? new Date().toISOString() : null,
      })
      .eq("id", record.id);

    return {
      valid: false,
      userId: record.user_id,
      email: record.email,
      attemptsLeft: remaining,
      lockout: isNowLocked,
      error: isNowLocked
        ? "Maximum verification attempts exceeded. Session locked."
        : `Invalid backup recovery code. ${remaining} attempt(s) remaining.`,
    };
  }

  // Atomic single-use consumption of the matched backup code
  const { data: consumedCodeRow } = await (adminSupabase.from("admin_backup_codes") as any)
    .update({ used_at: new Date().toISOString() })
    .eq("id", matchedRowId)
    .is("used_at", null)
    .select("id")
    .maybeSingle();

  if (!consumedCodeRow) {
    return {
      valid: false,
      userId: record.user_id,
      email: record.email,
      error: "This backup code has already been used.",
    };
  }

  await consumeChallengeRow(record.table, record.id);

  return {
    valid: true,
    userId: record.user_id,
    email: record.email,
    usedBackupCode: true,
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
  return { sessionToken: signedToken, expiresAt };
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
 * Rejects unverified sessions (401) and non-admin roles (403).
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
    console.error("[requireAdmin] Verification error:", err?.message);
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

export async function issueUserVerificationToken(
  userId: string,
  email: string,
  cooldownSeconds = 60
): Promise<IssueVerificationTokenOutcome> {
  const adminSupabase = createAdminClient();

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
