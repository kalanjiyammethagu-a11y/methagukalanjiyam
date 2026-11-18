-- ============================================================================
-- Migration: 009_auth_security_rework.sql
-- Description: Tables for Admin 2FA (Email OTP), User Email Verification, and Admin Sessions
-- Reversible: DROP TABLE public.admin_sessions, public.user_verification_tokens, public.admin_otp_codes CASCADE;
-- ============================================================================

-- 1. Admin Two-Step Verification OTP codes
CREATE TABLE IF NOT EXISTS public.admin_otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  hashed_code TEXT NOT NULL,
  pre_auth_token_hash TEXT NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 5,
  resend_count INT NOT NULL DEFAULT 0,
  last_sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_otp_user ON public.admin_otp_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_otp_preauth ON public.admin_otp_codes(pre_auth_token_hash);
CREATE INDEX IF NOT EXISTS idx_admin_otp_email ON public.admin_otp_codes(email);

-- 2. User Email Verification Tokens
CREATE TABLE IF NOT EXISTS public.user_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  hashed_token TEXT NOT NULL,
  token_type TEXT NOT NULL DEFAULT 'signup_confirmation',
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_verification_token ON public.user_verification_tokens(hashed_token);
CREATE INDEX IF NOT EXISTS idx_user_verification_user ON public.user_verification_tokens(user_id);

-- 3. Active Admin Sessions (Strict Server-Side Session Tracking)
CREATE TABLE IF NOT EXISTS public.admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token_hash TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON public.admin_sessions(session_token_hash);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_user ON public.admin_sessions(user_id);

-- Enable RLS and lock down access
ALTER TABLE public.admin_otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.admin_otp_codes TO service_role;
GRANT ALL ON public.user_verification_tokens TO service_role;
GRANT ALL ON public.admin_sessions TO service_role;

