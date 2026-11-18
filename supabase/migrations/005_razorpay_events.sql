-- ============================================================
-- 005_RAZORPAY_EVENTS.SQL
-- Methagu Kalanjiyam E-Commerce Platform
-- Idempotency and Audit Log for Razorpay Webhook Events
-- ============================================================

CREATE TABLE IF NOT EXISTS razorpay_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      TEXT NOT NULL UNIQUE,
  event_type    TEXT NOT NULL,
  payload       JSONB NOT NULL,
  processed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for rapid lookup during webhook idempotency checks
CREATE INDEX IF NOT EXISTS idx_razorpay_events_event_id ON razorpay_events (event_id);

-- Index for chronological auditing and debugging
CREATE INDEX IF NOT EXISTS idx_razorpay_events_created_at ON razorpay_events (created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE razorpay_events ENABLE ROW LEVEL SECURITY;

-- Service role has full access; no public access to financial webhook logs
CREATE POLICY "Service role full access on razorpay_events"
  ON razorpay_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
