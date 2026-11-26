-- ==============================================================================
-- Migration: 024_audit_remediation.sql
-- Purpose:
--   1. Add profiles.email column (referenced by signup & admin queries) + backfill
--   2. Add lookup_auth_user_by_email RPC to eliminate 1,000-user listUsers limit
--   3. Fix cancel_stale_pending_orders (replace nonexistent `notes` with `admin_notes`)
--   4. Fix create_order_atomic REVOKE/GRANT 14-argument signature
--   5. Align legacy 004 seed shipping defaults if still at 40/500
-- ==============================================================================

-- 1. Ensure public.profiles has email + index, backfilled from auth.users
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_email
  ON public.profiles (lower(email));

UPDATE public.profiles p
SET email = lower(u.email)
FROM auth.users u
WHERE u.id = p.id
  AND (p.email IS NULL OR p.email = '')
  AND u.email IS NOT NULL;

-- 2. Indexed lookup helper for auth.users by email (service_role only)
CREATE OR REPLACE FUNCTION public.lookup_auth_user_by_email(p_email TEXT)
RETURNS TABLE (
  id UUID,
  email TEXT,
  email_confirmed_at TIMESTAMPTZ,
  raw_user_meta_data JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.email::TEXT,
    u.email_confirmed_at,
    u.raw_user_meta_data
  FROM auth.users u
  WHERE lower(u.email) = lower(trim(p_email))
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

REVOKE EXECUTE ON FUNCTION public.lookup_auth_user_by_email(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lookup_auth_user_by_email(TEXT) TO service_role;

-- 3. Fix REVOKE/GRANT signature on 14-arg create_order_atomic
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'create_order_atomic'
  ) THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.create_order_atomic(TEXT, UUID, BOOLEAN, TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC, TEXT, TEXT, JSONB, TEXT, JSONB) FROM PUBLIC, anon, authenticated;';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.create_order_atomic(TEXT, UUID, BOOLEAN, TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC, TEXT, TEXT, JSONB, TEXT, JSONB) TO service_role;';
  END IF;
END $$;

-- 4. Fix cancel_stale_pending_orders (update admin_notes instead of nonexistent notes column)
CREATE OR REPLACE FUNCTION public.cancel_stale_pending_orders(p_older_than_minutes INT DEFAULT 30)
RETURNS INT AS $$
DECLARE
  v_cancelled_count INT := 0;
  v_order RECORD;
BEGIN
  FOR v_order IN
    SELECT id, order_number
    FROM public.orders
    WHERE status = 'pending'
      AND created_at < (now() - (p_older_than_minutes || ' minutes')::interval)
    FOR UPDATE SKIP LOCKED
  LOOP
    UPDATE public.orders
    SET status = 'cancelled',
        admin_notes = coalesce(admin_notes, '') || ' [தானியங்கி ரத்து: கட்டண நேரம் முடிந்தது]',
        updated_at = now()
    WHERE id = v_order.id;

    -- trg_orders_restore_stock restores inventory once on transition into cancelled
    v_cancelled_count := v_cancelled_count + 1;
  END LOOP;

  RETURN v_cancelled_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.cancel_stale_pending_orders(INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_stale_pending_orders(INT) TO service_role;

-- 5. Align legacy untouched 004 shipping defaults (40/500) to store rules (60/100/1000)
UPDATE public.site_settings
SET value = jsonb_set(
      jsonb_set(
        jsonb_set(value, '{standard_shipping_fee}', '60'::jsonb, true),
        '{other_india_shipping_fee}', '100'::jsonb, true
      ),
      '{free_shipping_threshold}', '1000'::jsonb, true
    ),
    updated_at = now()
WHERE key = 'shipping'
  AND (value->>'standard_shipping_fee')::numeric = 40;
