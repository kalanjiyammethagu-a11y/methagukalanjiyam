-- ============================================================================
-- Migration: 023_erp_sync_queue_hardening.sql
-- Replaces file-based / in-memory ERP queue state with Supabase PostgreSQL
-- Adds unique constraint on order_number and ERP reference columns.
-- NOTE: Non-destructive additive migration.
-- ============================================================================

ALTER TABLE public.erp_sync_queue
  ADD COLUMN IF NOT EXISTS erp_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS erp_sales_order_id TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uq_erp_sync_queue_order_number'
      AND conrelid = 'public.erp_sync_queue'::regclass
  ) THEN
    ALTER TABLE public.erp_sync_queue
      ADD CONSTRAINT uq_erp_sync_queue_order_number UNIQUE (order_number);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_erp_sync_queue_status_updated
  ON public.erp_sync_queue (status, updated_at DESC);

ALTER TABLE public.erp_sync_queue ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.erp_sync_queue FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.erp_sync_queue TO service_role;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'erp_sync_queue' AND policyname = 'Service role full access erp_sync_queue'
  ) THEN
    CREATE POLICY "Service role full access erp_sync_queue"
      ON public.erp_sync_queue
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
