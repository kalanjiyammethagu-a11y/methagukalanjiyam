-- ============================================================================
-- Migration: 021_auth_email_verification.sql
-- Task E1: Resend Email Verification Hardening, DB Cooldown & Auth Audit Log
-- NOTE: Do NOT execute directly against production without review.
-- ============================================================================

-- 1. Extend user_verification_tokens for DB-backed resend cooldown tracking (Worker-safe)
ALTER TABLE public.user_verification_tokens
  ADD COLUMN IF NOT EXISTS last_sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS resend_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_user_verification_user_created
  ON public.user_verification_tokens (user_id, created_at DESC);

-- Ensure strict RLS lock-down (service_role only; zero public/anon access)
ALTER TABLE public.user_verification_tokens ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.user_verification_tokens FROM PUBLIC;
REVOKE ALL ON public.user_verification_tokens FROM anon;
REVOKE ALL ON public.user_verification_tokens FROM authenticated;
GRANT ALL ON public.user_verification_tokens TO service_role;

-- 2. Structured security & authentication audit events table
-- IMPORTANT: Never store plaintext OTPs, backup codes, verification tokens, or secrets in metadata.
CREATE TABLE IF NOT EXISTS public.auth_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email      TEXT,
  event_type TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  metadata   JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auth_events_user_created
  ON public.auth_events (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_auth_events_type_created
  ON public.auth_events (event_type, created_at DESC);

ALTER TABLE public.auth_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read auth events" ON public.auth_events;
CREATE POLICY "Admins can read auth events"
  ON public.auth_events
  FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS "Service role full access auth events" ON public.auth_events;
CREATE POLICY "Service role full access auth events"
  ON public.auth_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

REVOKE INSERT, UPDATE, DELETE ON public.auth_events FROM PUBLIC, anon, authenticated;

-- ----------------------------------------------------------------------------
-- ROLLBACK NOTES (Manual execution only)
-- ----------------------------------------------------------------------------
-- DROP TABLE IF EXISTS public.auth_events;
-- ALTER TABLE public.user_verification_tokens
--   DROP COLUMN IF EXISTS last_sent_at,
--   DROP COLUMN IF EXISTS resend_count,
--   DROP COLUMN IF EXISTS verified_at;
