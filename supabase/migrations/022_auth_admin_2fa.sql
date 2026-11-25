-- ============================================================================
-- Migration: 022_auth_admin_2fa.sql
-- Task E2: Admin 2FA OTP Challenges & Single-Use Hashed Backup Codes
-- Non-destructive migration; preserves legacy admin_otp_codes during transition.
-- NOTE: Do NOT execute directly against production without review.
-- ============================================================================

-- 1. Admin 2FA OTP Challenges (Web Crypto CSPRNG + HMAC-SHA256)
CREATE TABLE IF NOT EXISTS public.admin_otp_challenges (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email               TEXT NOT NULL,
  otp_hash            TEXT NOT NULL,
  pre_auth_token_hash TEXT NOT NULL,
  attempts            INT NOT NULL DEFAULT 0,
  max_attempts        INT NOT NULL DEFAULT 5,
  resend_count        INT NOT NULL DEFAULT 0,
  last_sent_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at          TIMESTAMPTZ NOT NULL,
  consumed_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_otp_challenges_preauth
  ON public.admin_otp_challenges (pre_auth_token_hash)
  WHERE consumed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_admin_otp_challenges_user_created
  ON public.admin_otp_challenges (user_id, created_at DESC);

ALTER TABLE public.admin_otp_challenges ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_otp_challenges FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.admin_otp_challenges TO service_role;

-- 2. Admin Single-Use Hashed Backup Recovery Codes (8 per admin)
CREATE TABLE IF NOT EXISTS public.admin_backup_codes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash  TEXT NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, code_hash)
);

CREATE INDEX IF NOT EXISTS idx_admin_backup_codes_user_unused
  ON public.admin_backup_codes (user_id)
  WHERE used_at IS NULL;

ALTER TABLE public.admin_backup_codes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_backup_codes FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.admin_backup_codes TO service_role;

-- Ensure admin_sessions also has strict no-public RLS grants
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_sessions FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.admin_sessions TO service_role;

-- ----------------------------------------------------------------------------
-- ROLLBACK NOTES (Manual execution only)
-- ----------------------------------------------------------------------------
-- DROP TABLE IF EXISTS public.admin_backup_codes;
-- DROP TABLE IF EXISTS public.admin_otp_challenges;
